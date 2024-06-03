import { browser, Cookies, Tabs } from "wxt/browser";
import {
  getAndCheckReadwiseAccessToken,
  getWeReadCookies,
  setReadwiseAccessToken,
  syncCurrentBook,
  verifyAccessTokenOfReadwise,
} from "./utils";
import { useEffect, useRef, useState } from "react";

function loginWeReed(): Promise<Tabs.Tab> {
  return browser.tabs.create({ url: "https://weread.qq.com/#login" });
}
function loginReadWise(): Promise<Tabs.Tab> {
  return browser.tabs.create({ url: "https://readwise.io/access_token" });
}
const WeReadItem = ({
  title,
  status,
  onRecheck,
  login,
}: {
  title: string;
  status: boolean;
  onRecheck: () => void;
  login: () => Promise<Tabs.Tab>;
}) => {
  return (
    <div className="flex items-center mb-5 text-base">
      {status ? (
        <p className=" text-green-600">{title} is Ready!</p>
      ) : (
        <>
          <p className="text-gray-600 mr-5">{title}:</p>
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={login}
          >
            Login
          </button>
          <button
            type="button"
            // Always on the far right
            className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded  ml-auto"
            onClick={onRecheck}
          >
            Recheck
          </button>
        </>
      )}

      {/* Add some animation for loading */}
    </div>
  );
};

const ReadwiseItem = ({
  title,
  status,
  onRecheck,
  resetToken,
  login,
}: {
  title: string;
  status: boolean;
  onRecheck: () => void;
  resetToken: () => void;
  login: () => Promise<Tabs.Tab>;
}) => {
  const accessTokenRef = useRef<string>("");
  const [statusText, setStatusText] = useState<string>("");
  return (
    <div className="flex items-center mb-5 text-base">
      {status ? (
        <>
          <p className=" text-green-600">{title} is Ready!</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded text-base"
            onClick={resetToken}
          >
            reset access token
          </button>
        </>
      ) : (
        <div className="flex items-start">
          <p className="text-gray-600 mr-5">{title}:</p>
          <section className="flex flex-col gap-2">
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded text-base"
              onClick={login}
            >
              get your access token
            </button>
            <section className="flex items-center gap-1">
              <input
                className="h-10 caret-blue-500 focus:caret-indigo-500"
                onChange={(e) => {
                  accessTokenRef.current = e.target.value;
                }}
              />
              <button
                type="button"
                // Always on the far right
                className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded  ml-auto"
                onClick={async () => {
                  const isTokenValid = await verifyAccessTokenOfReadwise(
                    accessTokenRef.current
                  );
                  if (!isTokenValid) {
                    setStatusText("Invalid access token");
                    return;
                  }
                  await setReadwiseAccessToken(accessTokenRef.current);
                  onRecheck();
                }}
              >
                enter
              </button>
            </section>
            {!!statusText && <p className="text-red-600">{statusText}</p>}
          </section>
        </div>
      )}

      {/* Add some animation for loading */}
    </div>
  );
};
const SyncButton = ({
  readwiseAccessToken,
  weReadUsername,
}: {
  readwiseAccessToken: string;
  weReadUsername: string;
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stage, setStage] = useState("");
  const [bookCount, setBookCount] = useState(0);
  const [status, setStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const startSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await syncCurrentBook({
        accessToken: readwiseAccessToken,
        setStage,
        setBookCount,
        setStatus,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSyncing(false);
    }
  };
  switch (true) {
    case status:
      return (
        <div className="flex flex-col items-center">
          {/* Display beautiful green success message */}
          <span className="text-green-600">Success! </span>
          {/* Disply import book count */}
          <span className="text-green-600">Import {bookCount} books!</span>
        </div>
      );
    case isSyncing:
      return (
        // dont close this page
        <div className="flex flex-col items-center">
          <p className="text-gray-600 mb-5">
            <strong
              className="
            animate-pulse
            inline-block
            bg-gray-200
            rounded-full
            px-3
            py-1
            text-sm
            font-semibold
            text-red-700
            mr-2
            mb-2
          "
            >
              Please don&#39;t close this page
            </strong>
          </p>
          <strong>Syncing...</strong>
          <p className="text-gray-600 mb-5">
            <strong className="mr-auto">Stage:</strong>
            <span className="ml-auto"> {stage} </span>
          </p>
          <p className="text-gray-600 mb-5">
            <strong className="mr-auto">Book Count:</strong>{" "}
            <span className="ml-auto"> {bookCount}</span>
          </p>
          {errorMessage && (
            <p className="text-gray-600 mb-5">
              <strong className="mr-auto">Error:</strong>
              <span className="ml-auto"> {errorMessage}</span>
            </p>
          )}
        </div>
      );
    case !readwiseAccessToken || !weReadUsername:
      return <></>;
    default:
      return (
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
          disabled={!readwiseAccessToken || !weReadUsername}
          onClick={startSync}
        >
          🚀 Start Sync
        </button>
      );
  }
};

const Popup = () => {
  const [ReadWiseToken, setReadWiseToken] = useState("");
  const [wxReedCookies, setWxReedCookies] = useState<Cookies.Cookie[] | null>(
    null
  );
  const [weReedUsername, setWeReedUsername] = useState("");
  const updateReadWiseToken = async (): Promise<void> => {
    const token = await getAndCheckReadwiseAccessToken();
    token && setReadWiseToken(token);
  };
  const updateWeReadUserName = (cookies: Cookies.Cookie[]): void => {
    cookies.find((cookie) => {
      if (cookie.name === "wr_name") {
        setWeReedUsername(cookie.value);
        return true;
      }
      return false;
    });
  };
  const updateWeReedAuthInfo = async (): Promise<void> => {
    const cookies = await getWeReadCookies();
    setWxReedCookies(cookies);
  };
  // Init data
  useEffect(() => {
    updateReadWiseToken();
    updateWeReedAuthInfo();
  }, []);
  useEffect(() => {
    if (wxReedCookies) {
      updateWeReadUserName(wxReedCookies);
    }
  }, [wxReedCookies]);
  // Automatic redetection every 1s

  return (
    <section id="popup" className="w-96">
      <div className="container mx-auto bg-gray-200 rounded-xl shadow border p-8">
        <h2 className="text-2xl text-gray-700 font-bold mb-5">
          WeRead 2 Readwise
        </h2>
        <p className="text-gray-600 mb-5 text-base">
          This extension will help you to sync your reading highlight from
          WeRead to Readwise.
        </p>
        <p className="text-gray-600 mb-5 text-lg">
          <strong>Step 1:</strong> Login to WeRead; Login Readwise and generate
          a AccecssToken.
        </p>
        <p className="text-gray-600 mb-5 text-lg">
          <strong>Step 2:</strong> Click the button below to start syncing.
        </p>
        {/* Display WeRead Status and add recheck button */}
        <WeReadItem
          title="WeRead"
          status={!!weReedUsername}
          onRecheck={updateWeReedAuthInfo}
          login={loginWeReed}
        />

        {/* Add Readwise Status */}
        <ReadwiseItem
          title="Readwise"
          status={!!ReadWiseToken}
          resetToken={() => setReadWiseToken("")}
          onRecheck={updateReadWiseToken}
          login={loginReadWise}
        />
        <div className="flex">
          <SyncButton
            readwiseAccessToken={ReadWiseToken}
            weReadUsername={weReedUsername}
          />
        </div>
      </div>
    </section>
  );
};

export default Popup;
