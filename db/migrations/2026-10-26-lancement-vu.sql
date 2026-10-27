alter table users add column if not exists lancement_vu timestamptz;
update users set lancement_vu = now() where role = 'admin' and lancement_vu is null;
