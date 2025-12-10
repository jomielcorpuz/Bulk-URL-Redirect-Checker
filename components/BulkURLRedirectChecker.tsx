"use client"
import React, { useMemo, useState } from "react"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Copy, Download, ExternalLink, Globe, Search, ShieldCheck, ShieldAlert, ShieldX, ArrowRight } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import ThemeToggle from "./ui/theme-toggle"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"

type Row = {
    id: string
    status: number | string
    initialStatus?: number | string
    url: string // normalized URL for scanning
    displayUrl: string // original pasted URL for display
    destination?: string
    type?: string
    headers?: Record<string, string>
    hops?: { url: string; status?: number | string; location?: string }[]
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Normalize URL: add http:// if no protocol is present
function normalizeUrl(input: string): string {
    const trimmed = input.trim()
    if (!trimmed) return trimmed
    // If it doesn't start with http:// or https://, prepend http://
    if (!/^https?:\/\//i.test(trimmed)) {
        return `http://${trimmed}`
    }
    return trimmed
}

// Normalize status codes: display 202 as 200, etc.
function normalizeStatusForDisplay(status: number | string): number | string {
    if (typeof status === 'number' && status === 202) {
        return 200
    }
    return status
}

export default function BulkURLRedirectChecker() {
    const [input, setInput] = useState<string>("")
    const [rows, setRows] = useState<Row[]>([])
    const [filter, setFilter] = useState<string>("")
    const [page, setPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(100)
    const [scanning, setScanning] = useState(false)
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

    const parsedUrls = useMemo(() => {
        return input
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
    }, [input])

    async function scan() {
        const list = parsedUrls
        if (!list.length) return
        setScanning(true)
        setRows([]) // Start with empty rows, add them as they're scanned

        for (let i = 0; i < list.length; i++) {
            const url = normalizeUrl(list[i])
            try {
                // Call server-side API to scan the URL
                const response = await fetch("/api/scan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to scan URL")
                }

                const result = await response.json()
                setRows((prev) =>
                    [
                        ...prev,
                        {
                            id: String(i),
                            url: url,
                            displayUrl: list[i],
                            status: result.status,
                            initialStatus: result.initialStatus,
                            destination: result.destination,
                            type: result.type,
                            headers: result.headers,
                            hops: result.hops,
                        }
                    ]
                )
            } catch (err: Error | unknown) {
                const message = err instanceof Error ? err.message : "Failed to fetch";
                setRows((prev) =>
                    [
                        ...prev,
                        {
                            id: String(i),
                            url: url,
                            displayUrl: list[i],
                            status: "error",
                            destination: message || "Failed to fetch",
                            type: "Error",
                            hops: [],
                        }
                    ]
                )
            }
        }

        setScanning(false)
    }

    const filtered = useMemo(() => {
        if (!filter) return rows
        const q = filter.toLowerCase()
        return rows.filter((r) => String(r.status).toLowerCase().includes(q) || r.url.toLowerCase().includes(q) || (r.destination || "").toLowerCase().includes(q))
    }, [rows, filter])

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
    const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

    function copyResults() {
        const csv = ["Status,URL,Destination,Type", ...rows.map((r) => `${r.status},"${r.url}","${r.destination ?? ""}",${r.type ?? ""}`)].join("\n")
        navigator.clipboard.writeText(csv)
    }

    function downloadReport() {
        const csv = ["Status,URL,Destination,Type", ...rows.map((r) => `${r.status},"${r.url}","${r.destination ?? ""}",${r.type ?? ""}`)].join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `redirect-report-${new Date().toISOString()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    function goToPage(p: number) {
        setPage(Math.min(Math.max(1, p), pageCount))
    }

    return (

        <>
            <div className="flex justify-end p-6">
                <ThemeToggle />
            </div>

            {/* Development Alert */}
            <div className="mx-6 sm:mx-12 lg:mx-20">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md mb-6">
                        ⚠️ This tool is under development. Bugs may occur.
                    </div>
                </div>
            </div>

            <div className="mx-6 sm:mx-12 lg:mx-20">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">Redirect Checker</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Paste one URL per line and click <span className="font-semibold">Check Redirects</span> to scan redirect chains and destinations.
                    </p>
                </div>
            </div>

            <div className="m-20">
                <Card>
                    <CardContent>
                        <div className="flex flex-col gap-2 my-10 mx-8 md:grid-cols-3 md:items-center">

                            <Textarea
                                placeholder="Enter one URL per line"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={6}
                                className="w-full resize-none rounded-md border p-3"
                            />
                            <div className="w-full flex items-start my-2">
                                <div className="flex items-start">

                                    {parsedUrls.length} URL{parsedUrls.length !== 1 ? "s" : ""}
                                </div>

                            </div>
                            <div className="flex items-start gap-2 ">

                                <div className="flex w-full flex-col gap-2">
                                    <div className="flex items-center gap-2 ">



                                        <Button onClick={scan} disabled={scanning} className="px-12 py-6 text-lg">
                                            {scanning ? "Scanning..." : "Check Redirects"}
                                        </Button>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div >



            <Card className="m-20">

                <CardContent>
                    <div className="space-y-4 my-8 mx-8">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex  items-center gap-2">
                                <input
                                    placeholder="Search URLs or status codes..."
                                    value={filter}
                                    onChange={(e) => { setFilter(e.target.value); setPage(1) }}
                                    className="input h-10 w-[360px] rounded-md border px-3"
                                />
                                <Button variant="ghost" size="sm" onClick={() => { setFilter("") }}>
                                    <Search className="mr-1 h-4 w-4" /> Clear
                                </Button>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                {rows.length} URLs scanned
                                <span className="mx-1">·</span>
                                <span className="text-green-600">
                                    {rows.filter((r) => String(r.status).match(/^2/)).length} ok
                                </span>
                                <span className="mx-1">·</span>
                                <span className="text-red-600">
                                    {rows.filter((r) => String(r.status).match(/^4|^5|error/)).length} error
                                </span>
                            </div>



                            <div className="hidden sm:flex gap-2">
                                <div className="flex sm:flex-col  space-y-2 sm:w-full">

                                    <Button className="sm:w-full" variant="outline" size="sm" onClick={copyResults}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy Results
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={downloadReport}>
                                        <Download className="mr-2 h-4 w-4" /> Download Report
                                    </Button>
                                </div>
                            </div>
                        </div>



                        <div className="overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead style={{ width: "12%" }}>Status</TableHead>
                                        <TableHead style={{ width: "38%" }}>URL</TableHead>
                                        <TableHead style={{ width: "38%" }}>Destination</TableHead>
                                        <TableHead style={{ width: "12%" }}>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageData.map((r) => (
                                        <React.Fragment key={r.id}>
                                            <TableRow
                                                onClick={() => setExpandedIds((s) => ({ ...s, [r.id]: !s[r.id] }))}
                                                className="cursor-pointer hover:bg-muted/70 transition-colors"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">{expandedIds[r.id] ? "▾" : "▸"}</span>
                                                        <span
                                                            className={`font-semibold ${String(r.initialStatus || r.status).toString().startsWith("2")
                                                                ? "text-emerald-600"
                                                                : String(r.initialStatus || r.status).toString().startsWith("3")
                                                                    ? "text-[#f9771c]"   // custom hex color
                                                                    : String(r.initialStatus || r.status) === "error"
                                                                        ? "text-red-600"
                                                                        : "text-slate-600"
                                                                }`}
                                                        >
                                                            {String(r.initialStatus || r.status)}
                                                        </span>

                                                    </div>
                                                </TableCell>
                                                <TableCell className="truncate flex items-center gap-2">
                                                    <ArrowRight size={20} className="text-emerald-400" />
                                                    <Globe size={20} color="#f9771c" className="flex-shrink-0" />
                                                    <span className="truncate">{r.displayUrl}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigator.clipboard.writeText(r.displayUrl)
                                                        }}
                                                        className="flex-shrink-0 p-1 hover:bg-muted/50 rounded-sm"
                                                        title="Copy URL"
                                                    >
                                                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </TableCell>
                                                <TableCell className="truncate">
                                                    <div className="flex items-center">
                                                        <div className="flex items-center mx-4">
                                                            {String(normalizeStatusForDisplay(r.status)).toString().startsWith("2") ? (
                                                                <ShieldCheck size={16} color="#0bb87e" className="mr-2" />
                                                            ) : String(normalizeStatusForDisplay(r.status)).toString().startsWith("3") || String(normalizeStatusForDisplay(r.status)).toString().startsWith("4") ? (
                                                                <ShieldAlert size={16} color="#f59e0b" className="mr-2" />
                                                            ) : (
                                                                <ShieldX size={16} color="#ef4444" className="mr-2" />
                                                            )}
                                                            <span className={`font-semibold ${String(normalizeStatusForDisplay(r.status)).toString().startsWith("2") ? "text-emerald-400" : String(normalizeStatusForDisplay(r.status)).toString().startsWith("3") ? "text-amber-600" : String(normalizeStatusForDisplay(r.status)) === "error" ? "text-red-600" : "text-slate-600"}`}>
                                                                {String(normalizeStatusForDisplay(r.status))}
                                                            </span>

                                                        </div>
                                                        {r.destination ? (
                                                            <a
                                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                                                                href={r.destination}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="truncate">{r.destination}</span>
                                                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                                            </a>
                                                        ) : (
                                                            ""
                                                        )}
                                                    </div>

                                                </TableCell>
                                                <TableCell>{r.type}</TableCell>
                                            </TableRow>

                                            <TableRow className={`${expandedIds[r.id] ? "" : "hidden"}`}>
                                                <TableCell colSpan={4}>
                                                    <div className="flex flex-col gap-2 py-2">
                                                        <div className="flex gap-4 text-sm">
                                                            <div className="min-w-[160px]"><strong>Final URL:</strong> <span className="ml-2 break-all">{r.destination ?? "-"}</span></div>
                                                            <div className="min-w-[120px]"><strong>Status:</strong> <span className="ml-2">{String(normalizeStatusForDisplay(r.status))}</span></div>
                                                            <div className="min-w-[120px]"><strong>Type:</strong> <span className="ml-2">{r.type ?? "-"}</span></div>
                                                        </div>

                                                        <div>
                                                            <strong>Redirect Hops</strong>
                                                            <div className="mt-1 rounded-md bg-muted/20 p-2 text-sm">
                                                                {r.hops && r.hops.length > 0 ? (
                                                                    <ol className="list-decimal list-inside">
                                                                        {r.hops.map((h, idx) => (
                                                                            <li key={idx} className="truncate">
                                                                                <div><span className="font-medium">{h.status ?? "?"}</span> — <span className="break-all">{h.url}</span>{h.location ? <span> → {h.location}</span> : null}</div>
                                                                            </li>
                                                                        ))}
                                                                    </ol>
                                                                ) : (
                                                                    <div className="text-sm text-muted-foreground">No redirect hops recorded.</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <strong>Response Headers</strong>
                                                            <div className="mt-1 rounded-md bg-muted/20 p-2 text-sm">
                                                                {r.headers && Object.keys(r.headers).length > 0 ? (
                                                                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(r.headers, null, 2)}</pre>
                                                                ) : (
                                                                    <div className="text-sm text-muted-foreground">No headers available (CORS may block header access).</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between">
                            <div />

                            <select className="input h-10 rounded-md border px-2" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                                {PAGE_SIZE_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s} URLs</option>
                                ))}
                            </select>


                            <Pagination aria-label="pagination" className="w-auto">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious onClick={() => goToPage(page - 1)} />
                                    </PaginationItem>

                                    {Array.from({ length: pageCount }).map((_, i) => {
                                        const p = i + 1
                                        if (pageCount > 7) {
                                            // compact display
                                            if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) {
                                                return (
                                                    <PaginationItem key={p}>
                                                        <PaginationLink isActive={p === page} onClick={() => goToPage(p)}>{p}</PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                            if (p === 2 && page > 3) return <PaginationItem key={`ell-${p}`}><PaginationEllipsis /></PaginationItem>
                                            if (p === pageCount - 1 && page < pageCount - 2) return <PaginationItem key={`ell2-${p}`}><PaginationEllipsis /></PaginationItem>
                                            return null
                                        }
                                        return (
                                            <PaginationItem key={p}>
                                                <PaginationLink isActive={p === page} onClick={() => goToPage(p)}>{p}</PaginationLink>
                                            </PaginationItem>
                                        )
                                    })}

                                    <PaginationItem>
                                        <PaginationNext onClick={() => goToPage(page + 1)} />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>

                </CardContent>
            </Card>

        </>
    )
}