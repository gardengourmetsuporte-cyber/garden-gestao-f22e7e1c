
-- Create RPC function to calculate leaderboard data server-side
-- This avoids the 1000-row client limit issue
CREATE OR REPLACE FUNCTION public.get_leaderboard_data(
  p_unit_id uuid,
  p_month_start date,
  p_month_end date
)
RETURNS TABLE (
  user_id uuid,
  earned_points bigint,
  bonus_points bigint,
  spent_points bigint,
  earned_all_time bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH monthly_earned AS (
    SELECT 
      cc.completed_by AS user_id,
      COALESCE(SUM(CASE WHEN cc.awarded_points = true THEN cc.points_awarded ELSE 0 END), 0) AS earned
    FROM checklist_completions cc
    WHERE cc.unit_id = p_unit_id
      AND cc.date >= p_month_start
      AND cc.date <= p_month_end
    GROUP BY cc.completed_by
  ),
  all_time_earned AS (
    SELECT 
      cc.completed_by AS user_id,
      COALESCE(SUM(CASE WHEN cc.awarded_points = true THEN cc.points_awarded ELSE 0 END), 0) AS earned
    FROM checklist_completions cc
    WHERE cc.unit_id = p_unit_id
    GROUP BY cc.completed_by
  ),
  bonus AS (
    SELECT 
      bp.user_id,
      COALESCE(SUM(bp.points), 0) AS bonus
    FROM bonus_points bp
    WHERE bp.unit_id = p_unit_id
      AND bp.month = p_month_start
    GROUP BY bp.user_id
  ),
  spent AS (
    SELECT 
      rr.user_id,
      COALESCE(SUM(CASE WHEN rr.status IN ('approved', 'delivered') THEN rr.points_spent ELSE 0 END), 0) AS spent
    FROM reward_redemptions rr
    WHERE rr.unit_id = p_unit_id
    GROUP BY rr.user_id
  ),
  all_users AS (
    SELECT uu.user_id FROM user_units uu WHERE uu.unit_id = p_unit_id
  )
  SELECT
    au.user_id,
    COALESCE(me.earned, 0) AS earned_points,
    COALESCE(b.bonus, 0) AS bonus_points,
    COALESCE(s.spent, 0) AS spent_points,
    COALESCE(ae.earned, 0) AS earned_all_time
  FROM all_users au
  LEFT JOIN monthly_earned me ON me.user_id = au.user_id
  LEFT JOIN all_time_earned ae ON ae.user_id = au.user_id
  LEFT JOIN bonus b ON b.user_id = au.user_id
  LEFT JOIN spent s ON s.user_id = au.user_id;
$$;
