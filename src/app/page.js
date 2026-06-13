import { getLicenses, addLicense, toggleLicense, deleteLicense } from './actions';

export default async function Page() {
  const licenses = await getLicenses();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Enterprise License Server</h1>
        </div>

        {/* Generate License */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Generate New License Key</h2>
          <form action={addLicense} className="flex gap-4">
            <input 
              type="text" 
              name="userName" 
              placeholder="Customer / Company Name" 
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required 
            />
            <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Generate License
            </button>
          </form>
        </div>

        {/* Licenses List */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">User ID</th>
                <th className="px-6 py-4 font-semibold">Customer Name</th>
                <th className="px-6 py-4 font-semibold">License Key (Secret)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No licenses generated yet.
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => {
                  return (
                  <tr key={lic.licenseKey} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-blue-700 font-bold">{lic.userId}</td>
                    <td className="px-6 py-4 font-medium">{lic.userName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 bg-gray-100 rounded px-2 select-all cursor-pointer">
                      {lic.licenseKey}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${lic.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {lic.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <form action={async () => {
                          'use server';
                          await toggleLicense(lic.licenseKey, lic.status === 'active' ? 'revoked' : 'active');
                        }}>
                          <button type="submit" className="w-24 rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
                            {lic.status === 'active' ? 'Revoke' : 'Activate'}
                          </button>
                        </form>
                        
                        <form action={async () => {
                          'use server';
                          await deleteLicense(lic.licenseKey);
                        }}>
                          <button type="submit" className="w-20 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 rounded-lg bg-yellow-50 p-6 shadow-sm border border-yellow-200">
          <h2 className="mb-2 text-xl font-semibold text-yellow-900">How to use this system:</h2>
          <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-2">
            <li>Generate a new license key above for a specific customer.</li>
            <li>Copy the <strong>License Key (Secret)</strong>.</li>
            <li>Open the customer's website files (e.g. <code>radiomuziekexspress/includes/license.php</code>)</li>
            <li>Paste the key into the <code>$license_key</code> variable.</li>
            <li>If you ever click <strong>Revoke</strong> on this dashboard, the customer's website will instantly throw a 403 Forbidden suspension error!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
