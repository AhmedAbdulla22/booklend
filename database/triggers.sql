-- Trigger for handling overdue book notifications
-- This trigger creates notifications when books become overdue and includes borrower information

-- First, ensure the notifications table has the proper structure
-- (This assumes notifications table already exists with user_id column)

-- Function to create overdue notifications
CREATE OR REPLACE FUNCTION handle_overdue_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the loan status changed to ACTIVE or if due_date is in the past
    IF NEW.status = 'ACTIVE' AND NEW.due_date < NOW() THEN
        -- Create overdue notification for admin
        INSERT INTO notifications (
            user_id,
            message,
            type,
            read,
            created_at,
            metadata
        )
        SELECT 
            -- Find admin user (assuming there's an admin role or specific admin_id)
            (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
            -- Include borrower name in the message
            CONCAT('Overdue by ', p.full_name, ': ', b.title),
            'warning',
            false,
            NOW(),
            jsonb_build_object(
                'loan_id', NEW.id,
                'book_id', NEW.book_id,
                'borrower_id', NEW.user_id,
                'borrower_name', p.full_name,
                'book_title', b.title,
                'due_date', NEW.due_date,
                'days_overdue', EXTRACT(DAY FROM (NOW() - NEW.due_date))
            )
        FROM profiles p
        JOIN books b ON NEW.book_id = b.id
        WHERE p.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on loan insert/update
DROP TRIGGER IF EXISTS overdue_notifications_trigger ON loans;
CREATE TRIGGER overdue_notifications_trigger
    AFTER INSERT OR UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION handle_overdue_notifications();

-- Alternative approach: Create a function to check all overdue loans and generate notifications
-- This can be called periodically (e.g., daily cron job)
CREATE OR REPLACE FUNCTION generate_daily_overdue_notifications()
RETURNS void AS $$
DECLARE
    overdue_loans RECORD;
BEGIN
    -- Find all overdue loans that don't have recent notifications
    FOR overdue_loans IN 
        SELECT 
            l.id,
            l.user_id,
            l.book_id,
            l.due_date,
            p.full_name as borrower_name,
            b.title as book_title
        FROM loans l
        JOIN profiles p ON l.user_id = p.id
        JOIN books b ON l.book_id = b.id
        WHERE l.status = 'ACTIVE' 
        AND l.due_date < NOW()
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.metadata->>'loan_id' = l.id::text 
            AND n.created_at > NOW() - INTERVAL '24 hours'
        )
    LOOP
        -- Create notification for admin
        INSERT INTO notifications (
            user_id,
            message,
            type,
            read,
            created_at,
            metadata
        )
        SELECT 
            (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
            CONCAT('Overdue by ', overdue_loans.borrower_name, ': ', overdue_loans.book_title),
            'warning',
            false,
            NOW(),
            jsonb_build_object(
                'loan_id', overdue_loans.id,
                'book_id', overdue_loans.book_id,
                'borrower_id', overdue_loans.user_id,
                'borrower_name', overdue_loans.borrower_name,
                'book_title', overdue_loans.book_title,
                'due_date', overdue_loans.due_date,
                'days_overdue', EXTRACT(DAY FROM (NOW() - overdue_loans.due_date))
            );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function (if using Supabase pg_cron extension)
-- This would run daily at 9 AM
-- SELECT cron.schedule('daily-overdue-check', '0 9 * * *', 'SELECT generate_daily_overdue_notifications();');
