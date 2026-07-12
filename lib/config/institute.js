// lib/config/institute.js
// Central, single source of truth for institute branding used across ALL report
// templates (Academic Calendar, Attendance, Result, Fee, etc).
// Update these values in one place and every report picks them up automatically.
//
// If you already store this in the DB / admin settings, replace the static
// object below with a fetch/query and export the same shape — every report
// component consuming `INSTITUTE_INFO` (or the `institute` prop override)
// will keep working unchanged.

export const INSTITUTE_INFO = {
  name: 'Asian College of Higher Studies',
  shortName: 'ACHS',
  location: 'Ekantakuna, Lalitpur',
  logo: '/logo.png', // put the college logo at /public/logo.png (or pass logoUrl prop to override)
  phone: '+977-1-5912727',
  email: 'info@achsnepal.edu.np',
  website: 'www.achsnepal.edu.np',
};

export default INSTITUTE_INFO;