
CREATE OR REPLACE FUNCTION public.get_global_leaderboard_data(p_month_start date, p_month_end date)
 RETURNS TABLE(user_id uuid, earned_points bigint, bonus_points bigint, spent_points bigint, earned_all_time bigint, unit_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH monthly_earned AS (
    SELECT 
      cc.completed_by AS user_id,
      COALESCE(SUM(CASE WHEN cc.awarded_points = true THEN cc.points_awarded ELSE 0 END), 0) AS earned
    FROM checklist_completions cc
    WHERE cc.date >= p_month_start
      AND cc.date <= p_month_end
    GROUP BY cc.completed_by
  ),
  all_time_earned AS (
    SELECT 
      cc.completed_by AS user_id,
      COALESCE(SUM(CASE WHEN cc.awarded_points = true THEN cc.points_awarded ELSE 0 END), 0) AS earned
    FROM checklist_completions cc
    GROUP BY cc.completed_by
  ),
  bonus AS (
    SELECT 
      bp.user_id,
      COALESCE(SUM(bp.points), 0) AS bonus
    FROM bonus_points bp
    WHERE bp.month = p_month_start
    GROUP BY bp.user_id
  ),
  spent AS (
    SELECT 
      rr.user_id,
      COALESCE(SUM(CASE WHEN rr.status IN ('approved', 'delivered') THEN rr.points_spent ELSE 0 END), 0) AS spent
    FROM reward_redemptions rr
    GROUP BY rr.user_id
  ),
  all_users AS (
    SELECT DISTINCT uu.user_id, uu.unit_id
    FROM user_units uu
  ),
  -- Pick one unit per user (prefer is_default, fallback to first)
  user_primary_unit AS (
    SELECT DISTINCT ON (au.user_id) au.user_id, au.unit_id
    FROM all_users au
    LEFT JOIN user_units uu ON uu.user_id = au.user_id AND uu.unit_id = au.unit_id
    ORDER BY au.user_id, (CASE WHEN uu.is_default THEN 0 ELSE 1 END), au.unit_id
  )
  SELECT
    upu.user_id,
    COALESCE(me.earned, 0) AS earned_points,
    COALESCE(b.bonus, 0) AS bonus_points,
    COALESCE(s.spent, 0) AS spent_points,
    COALESCE(ae.earned, 0) AS earned_all_time,
    upu.unit_id
  FROM user_primary_unit upu
  LEFT JOIN monthly_earned me ON me.user_id = upu.user_id
  LEFT JOIN all_time_earned ae ON ae.user_id = upu.user_id
  LEFT JOIN bonus b ON b.user_id = upu.user_id
  LEFT JOIN spent s ON s.user_id = upu.user_id;
$function$;
