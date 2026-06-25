// src/app/page.js

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default function Home() {
  return redirect('/login');
}