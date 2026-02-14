
-- Fix 1: Make payment-proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- Fix 2: Create atomic balance adjustment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.adjust_balance(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  UPDATE profiles 
  SET balance = balance + p_amount 
  WHERE id = p_user_id
  RETURNING balance INTO new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  RETURN new_balance;
END;
$$;
