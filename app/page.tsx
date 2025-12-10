import BulkURLRedirectChecker from "@/components/BulkURLRedirectChecker";


export const metadata = {
  title: 'Bulk URL Redirect Checker',
  description: 'Check multiple URLs for redirects in bulk.',
  icons: {
    icon: '/favicon.ico',
  },
};


export default function Page() {
  return <BulkURLRedirectChecker />;
}
