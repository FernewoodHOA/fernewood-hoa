export const siteConfig = {
  name: "Fernewood Homeowners Association",
  shortName: "Fernewood HOA",
  location: "Lafayette, LA",
  description:
    "Official website of the Fernewood Homeowners Association in Lafayette, LA.",
  // The covenants now live in the association's own Supabase storage — see
  // lib/documents.ts. This Drive folder belongs to a resident who isn't on
  // the board and is kept only as a backup reference; nothing on the site
  // links to it.
  covenantsBackupDriveUrl:
    "https://drive.google.com/drive/folders/1G5Ot95snvE_QkgHn5S2YW4Nhx8sE-VhA",
};
