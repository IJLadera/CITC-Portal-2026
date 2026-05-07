import { useEffect } from "react";

const GREENWATTS_URL = "http://localhost:8002/";

export default function GreenWattsRedirect() {
    useEffect(() => {
        window.location.href = GREENWATTS_URL;
    }, []);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Opening GreenWatts...</h1>
            <p className="mt-4 text-gray-600 max-w-xl">
                You are being redirected to the GreenWatts application. If the redirect does not start automatically,
                click the button below.
            </p>
            <a
                href={GREENWATTS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-green-700"
            >
                Open GreenWatts
            </a>
        </div>
    );
}
