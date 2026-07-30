import type {
    Key,
    ReactNode,
} from "react";

import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";

export interface DataTableColumn<T> {
    key: string;
    header: ReactNode;

    render: (
        row: T,
        rowIndex: number,
    ) => ReactNode;

    className?: string;
    headerClassName?: string;
    mobileLabel?: string;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];

    getRowKey: (
        row: T,
        rowIndex: number,
    ) => Key;

    isLoading?: boolean;
    loadingRows?: number;

    emptyTitle?: string;
    emptyDescription?: string;

    caption?: string;
    className?: string;
    tableClassName?: string;

    onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
    columns,
    data,
    getRowKey,
    isLoading = false,
    loadingRows = 5,
    emptyTitle = "No records found",
    emptyDescription =
        "There is currently no information to display.",
    caption,
    className = "",
    tableClassName = "",
    onRowClick,
}: DataTableProps<T>) {
    if (
        !isLoading &&
        data.length === 0
    ) {
        return (
            <EmptyState
                title={emptyTitle}
                description={
                    emptyDescription
                }
                compact
                className={className}
            />
        );
    }

    return (
        <div
            className={[
                "overflow-hidden border border-neutral-200 bg-white",
                className,
            ].join(" ")}
        >
            <div className="w-full overflow-x-auto">
                <table
                    className={[
                        "w-full min-w-[720px] border-collapse text-left",
                        tableClassName,
                    ].join(" ")}
                >
                    {caption ? (
                        <caption className="sr-only">
                            {caption}
                        </caption>
                    ) : null}

                    <thead className="bg-[#35822E]/10">
                        <tr>
                            {columns.map(
                                (column) => (
                                    <th
                                        key={
                                            column.key
                                        }
                                        scope="col"
                                        className={[
                                            "px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#01301E]",
                                            column.headerClassName ??
                                                "",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {
                                            column.header
                                        }
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                        {isLoading
                            ? Array.from({
                                  length: loadingRows,
                              }).map(
                                  (
                                      _,
                                      rowIndex,
                                  ) => (
                                      <tr
                                          key={
                                              rowIndex
                                          }
                                      >
                                          {columns.map(
                                              (
                                                  column,
                                              ) => (
                                                  <td
                                                      key={
                                                          column.key
                                                      }
                                                      className="px-5 py-4"
                                                  >
                                                      <LoadingSkeleton className="h-4 w-full max-w-32" />
                                                  </td>
                                              ),
                                          )}
                                      </tr>
                                  ),
                              )
                            : data.map(
                                  (
                                      row,
                                      rowIndex,
                                  ) => (
                                      <tr
                                          key={getRowKey(
                                              row,
                                              rowIndex,
                                          )}
                                          tabIndex={
                                              onRowClick
                                                  ? 0
                                                  : undefined
                                          }
                                          onClick={() =>
                                              onRowClick?.(
                                                  row,
                                              )
                                          }
                                          onKeyDown={(
                                              event,
                                          ) => {
                                              if (
                                                  !onRowClick
                                              ) {
                                                  return;
                                              }

                                              if (
                                                  event.key ===
                                                      "Enter" ||
                                                  event.key ===
                                                      " "
                                              ) {
                                                  event.preventDefault();

                                                  onRowClick(
                                                      row,
                                                  );
                                              }
                                          }}
                                          className={[
                                              "transition-colors",
                                              onRowClick
                                                  ? "cursor-pointer hover:bg-[#35822E]/5 focus:bg-[#35822E]/5 focus:outline-none"
                                                  : "hover:bg-neutral-50",
                                          ].join(
                                              " ",
                                          )}
                                      >
                                          {columns.map(
                                              (
                                                  column,
                                              ) => (
                                                  <td
                                                      key={
                                                          column.key
                                                      }
                                                      data-label={
                                                          column.mobileLabel
                                                      }
                                                      className={[
                                                          "px-5 py-4 text-sm text-neutral-700",
                                                          column.className ??
                                                              "",
                                                      ].join(
                                                          " ",
                                                      )}
                                                  >
                                                      {column.render(
                                                          row,
                                                          rowIndex,
                                                      )}
                                                  </td>
                                              ),
                                          )}
                                      </tr>
                                  ),
                              )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}