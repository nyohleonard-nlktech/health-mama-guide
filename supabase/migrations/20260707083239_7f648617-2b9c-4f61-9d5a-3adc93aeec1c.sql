
REVOKE EXECUTE ON FUNCTION public.user_track(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_track(uuid) TO authenticated, service_role;
