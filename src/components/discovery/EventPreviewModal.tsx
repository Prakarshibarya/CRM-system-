"use client";

export default function EventPreviewModal({
  open,
  events,
  onImport,
  onClose
}) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-[#0B0B10] border border-white/10 rounded-xl w-[900px] p-6">

        <h2 className="text-lg font-semibold mb-4">
          Discovered Events
        </h2>

        <table className="w-full text-sm">

          <thead className="text-white/50 border-b border-white/10">
            <tr>
              <th className="text-left py-2">Event</th>
              <th className="text-left py-2">City</th>
              <th className="text-left py-2">Link</th>
            </tr>
          </thead>

          <tbody>

            {events.map((e, i) => (
              <tr key={i} className="border-b border-white/5">

                <td className="py-2">{e.title}</td>
                <td>{e.city}</td>

                <td className="text-fuchsia-400">
                  <a href={e.eventLink} target="_blank">
                    View
                  </a>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        <div className="flex justify-end gap-3 mt-4">

          <button onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={onImport}
            className="bg-fuchsia-500 px-4 py-2 rounded"
          >
            Import All
          </button>

        </div>

      </div>

    </div>
  );
}