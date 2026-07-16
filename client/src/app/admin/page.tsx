import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to the products page by default
  redirect('/admin/product');
}
