import { browser, Cookies, Tabs } from "wxt/browser";
import {
  getAndCheckReadwiseAccessToken,
  getWeReadCookies,
  setReadwiseAccessToken,
  syncCurrentBook,
  verifyAccessTokenOfReadwise,
  checkIsBookPage,
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
            登录
          </button>
          <button
            type="button"
            // Always on the far right
            className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded  ml-auto"
            onClick={onRecheck}
          >
            重新检查
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
            重置access token
          </button>
        </>
      ) : (
        <div className="flex items-start flex-1">
          <p className="text-gray-600 mr-5">{title}:</p>
          <section className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 rounded text-base w-auto"
              onClick={login}
            >
              获取access token
            </button>
            <section className="flex items-center gap-1">
              <input
                className="h-10 caret-blue-500 focus:caret-indigo-500 flex-1"
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
                确认
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
  isBookPage,
}: {
  readwiseAccessToken: string;
  weReadUsername: string;
  isBookPage: boolean;
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stage, setStage] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [status, setStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const startSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await syncCurrentBook({
        accessToken: readwiseAccessToken,
        setStage,
        setCommentCount,
        setStatus,
      });
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
          <span className="text-green-600">导入成功! </span>
          {/* Disply import book count */}
          <span className="text-green-600">导入 {commentCount} 条笔记!</span>
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
              请不要关闭此页面
            </strong>
          </p>
          <strong>同步中...</strong>
          <p className="text-gray-600 mb-5">
            <strong className="mr-auto">阶段:</strong>
            <span className="ml-auto"> {stage} </span>
          </p>
          <p className="text-gray-600 mb-5">
            <strong className="mr-auto">笔记数量:</strong>{" "}
            <span className="ml-auto"> {commentCount}</span>
          </p>
          {errorMessage && (
            <p className="text-gray-600 mb-5">
              <strong className="mr-auto">错误:</strong>
              <span className="ml-auto"> {errorMessage}</span>
            </p>
          )}
        </div>
      );
    case !readwiseAccessToken || !weReadUsername:
      return <></>;
    case !isBookPage:
      return (
        <p>
          本插件目前只能在某本书的阅读页使用，页面链接类似:
          https://weread.qq.com/web/reader/xxxxx
        </p>
      );
    default:
      return (
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={!readwiseAccessToken || !weReadUsername}
          onClick={startSync}
        >
          🚀 一键同步
        </button>
      );
  }
};

const Popup = () => {
  const [ReadWiseToken, setReadWiseToken] = useState("");
  const [wxReedCookies, setWxReedCookies] = useState<Cookies.Cookie[] | null>(
    null
  );
  const [isBookPage, setIsBookPage] = useState(false);
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
  const updateIsBookPage = async (): Promise<void> => {
    const isBookPage = await checkIsBookPage();
    setIsBookPage(isBookPage);
  };
  // Init data
  useEffect(() => {
    updateReadWiseToken();
    updateWeReedAuthInfo();
    updateIsBookPage();
  }, []);
  useEffect(() => {
    if (wxReedCookies) {
      updateWeReadUserName(wxReedCookies);
    }
  }, [wxReedCookies]);
  // Automatic redetection every 1s

  return (
    <section id="popup" className="w-[450px]">
      <div className="container mx-auto bg-gray-200 rounded-xl shadow border p-8">
        <h2 className="text-2xl text-gray-700 font-bold mb-5">
          readwise微信读书笔记同步
        </h2>
        <p className="text-gray-600 mb-5 text-base">
          此插件将帮助您将微信读书笔记同步到readwise，目前近支持在某本书的页面进行同步，一次只能同步一本书的笔记。
        </p>
        <p className="text-gray-600 mb-5 text-lg">
          <strong>1: </strong>
          登录微信读书
        </p>
        <p className="text-gray-600 mb-5 text-lg">
          <strong>2: </strong>
          获取readwise access token
        </p>
        <p className="text-gray-600 mb-5 text-lg">
          <strong>3: </strong>
          点击同步按钮开始同步
        </p>
        {/* Display WeRead Status and add recheck button */}
        <WeReadItem
          title="微信读书"
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
            isBookPage={isBookPage}
          />
        </div>
      </div>
    </section>
  );
};

export default Popup;
