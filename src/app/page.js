import { getWebsites, toggleWebsite, deleteWebsite, updateContent, logout } from './actions';

export default async function Dashboard() {
  const websites = await getWebsites();

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">WebControl Dashboard</h1>
          <form action={logout}>
            <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
              Logout
            </button>
          </form>
        </div>

        {/* Installation Instructions */}
        <div className="mb-8 rounded-lg bg-blue-50 p-6 shadow-sm border border-blue-200">
          <h2 className="mb-2 text-xl font-semibold text-blue-900">Installation Snippet</h2>
          <p className="mb-4 text-sm text-blue-800">Paste this script in the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of the target website. The system will automatically detect the domain and directory.</p>
          <code className="block w-full rounded bg-blue-100 p-3 text-sm text-blue-900 overflow-x-auto">
            &lt;script src="https://wc.viterank.com/api/serve"&gt;&lt;/script&gt;
          </code>
        </div>



        {/* Websites List */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Domain</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Content to Inject</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {websites.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No websites added yet.
                  </td>
                </tr>
              ) : (
                websites.map((site) => (
                  <tr key={site.domain} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{site.domain}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${site.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {site.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      <form action={async (formData) => {
                        'use server';
                        await updateContent(site.domain, formData.get('content'));
                      }} className="flex flex-col gap-2">
                        <textarea 
                          name="content"
                          defaultValue={site.content || ''}
                          placeholder="HTML/Text to inject into the website"
                          className="w-full h-20 rounded border border-gray-300 p-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
                        ></textarea>
                        <button type="submit" className="self-end rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700">Save Content</button>
                      </form>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col justify-end gap-2 items-end">
                        <form action={async () => {
                          'use server';
                          await toggleWebsite(site.domain, site.status === 'paid' ? 'unpaid' : 'paid');
                        }}>
                          <button type="submit" className="w-24 rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
                            Mark {site.status === 'paid' ? 'Unpaid' : 'Paid'}
                          </button>
                        </form>
                        
                        <form action={async () => {
                          'use server';
                          await deleteWebsite(site.domain);
                        }}>
                          <button 
                            type="submit" 
                            className="w-24 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Delete Website
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
