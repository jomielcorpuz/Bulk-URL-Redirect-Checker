import { NextRequest, NextResponse } from "next/server";

type ScanResult = {
  status: number | string; // final status (for destination/right side)
  initialStatus: number | string; // initial status (for source/left side)
  destination: string;
  type: string;
  headers: Record<string, string>;
  hops: { url: string; status?: number | string; location?: string }[];
};

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid URL" },
        { status: 400 }
      );
    }

    const result = await scanUrl(url);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

async function scanUrl(inputUrl: string): Promise<ScanResult> {
  const maxHops = 10;
  let current = inputUrl;
  const hops: { url: string; status?: number | string; location?: string }[] =
    [];
  let finalStatus: number | string = "—";
  let finalUrl = "";
  let finalHeaders: Record<string, string> = {};
  let initialStatus: number | string = "—"; // Track the initial status of the first request

  // Custom User-Agent to avoid bot-blocking
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  for (let hop = 0; hop < maxHops; hop++) {
    try {
      const response = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        headers: {
          "User-Agent": userAgent,
        },
        timeout: 10000, // 10 second timeout
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Track initial status on first hop
      if (hop === 0) {
        initialStatus = response.status;
      }

      // If status is a redirect, try to read Location header
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        hops.push({
          url: current,
          status: response.status,
          location: location || undefined,
        });

        if (!location) {
          // No location header, can't continue
          finalStatus = response.status;
          finalUrl = current;
          finalHeaders = headers;
          break;
        }

        const next = new URL(location, current).toString();
        if (next === current) {
          // Prevent infinite loop
          finalStatus = response.status;
          finalUrl = current;
          finalHeaders = headers;
          break;
        }

        current = next;
        continue;
      }

      // Not a redirect, we're done
      finalStatus = response.status;
      finalUrl = response.url || current;
      finalHeaders = headers;
      break;
    } catch (e: any) {
      // HEAD failed, try GET
      try {
        const response = await fetch(current, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": userAgent,
          },
          timeout: 10000,
        });

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        // Track initial status on first hop
        if (hop === 0) {
          initialStatus = response.status;
        }

        finalStatus = response.status;
        finalUrl = response.url || current;
        finalHeaders = headers;
        break;
      } catch (getErr: any) {
        throw new Error(getErr?.message || "Failed to fetch URL");
      }
    }
  }

  // Determine type based on the INITIAL status (the status of the original domain)
  let type: string;
  if (typeof initialStatus === "number") {
    if (initialStatus === 301 || initialStatus === 308) {
      type = "Permanently";
    } else if (initialStatus === 302 || initialStatus === 307) {
      type = "Temporarily";
    } else if (initialStatus >= 300 && initialStatus < 400) {
      type = "Redirect";
    } else if (initialStatus >= 200 && initialStatus < 300) {
      type = "OK";
    } else if (initialStatus >= 400 && initialStatus < 500) {
      type = "Client Error";
    } else if (initialStatus >= 500) {
      type = "Server Error";
    } else {
      type = "Error";
    }
  } else {
    type = "Error";
  }

  return {
    status: finalStatus,
    initialStatus: initialStatus,
    destination: finalUrl,
    type,
    headers: finalHeaders,
    hops,
  };
}
