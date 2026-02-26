
-- First delete funcionario duplicates for users who already have admin
DELETE FROM user_roles
WHERE role = 'funcionario'::app_role
AND user_id IN (
  SELECT ur2.user_id FROM user_roles ur2 WHERE ur2.role IN ('admin'::app_role, 'super_admin'::app_role)
);

-- Then upgrade remaining owners who only have funcionario
UPDATE user_roles SET role = 'admin'::app_role
WHERE role = 'funcionario'::app_role
AND user_id IN (
  SELECT user_id FROM user_units WHERE role = 'owner'
);
