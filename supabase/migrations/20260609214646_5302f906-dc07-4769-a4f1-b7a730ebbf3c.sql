
CREATE POLICY "Users upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated can read profile media"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'profile-media');
