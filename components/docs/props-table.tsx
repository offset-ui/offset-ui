import type { PropGroup, PropRow } from "@/lib/props";

function Table({ rows, caption }: { rows: PropRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-black/10 bg-black/[.02] text-xs uppercase tracking-wider text-stone-500">
            <th scope="col" className="px-4 py-2.5 font-medium">
              Prop
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Default
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-black/5 align-top last:border-0">
              <th scope="row" className="px-4 py-3 font-mono text-[13px] font-medium">
                {row.name}
                {row.required && <span className="text-red-600">*</span>}
              </th>
              <td className="px-4 py-3">
                <code className="break-words font-mono text-xs text-stone-600">{row.type}</code>
              </td>
              <td className="px-4 py-3">{row.default ? <code className="break-words font-mono text-xs">{row.default}</code> : <span className="text-stone-400">–</span>}</td>
              <td className="px-4 py-3 text-stone-600">{row.description || <span className="text-stone-400">–</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PropsTable({ props, groups }: { props: PropRow[]; groups: PropGroup[] }) {
  if (props.length === 0) return null;
  return (
    <div className="space-y-8">
      <Table rows={props} caption="Props" />
      {groups.map((group) => (
        <div key={group.prop} className="space-y-3">
          <h3 className="text-sm font-medium">
            <code className="font-mono">{group.prop}</code> keys
          </h3>
          <Table rows={group.rows} caption={`${group.prop} keys`} />
        </div>
      ))}
    </div>
  );
}
