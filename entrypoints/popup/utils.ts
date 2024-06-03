import { IBookmarkRootObject, IReviews, WEreadDataInfo } from "./interface";
import { browser, Cookies, Tabs } from "wxt/browser";
import { uniqBy } from "lodash-es";

const READWISE_TOKEN = "readwise-token";

export const verifyAccessTokenOfReadwise = async (accessToken: string) => {
  const url = "https://readwise.io/api/v2/auth/";
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${accessToken}`,
    },
  });
  if (!response.ok) {
    return false;
  }
  return true;
};

const parseState = (state: string) => {
  const initValueReg = /window.__INITIAL_STATE__=(\{[\s\S]*?\});/;
  const initValue = initValueReg.exec(state)?.[0];
  if (!initValue) {
    throw new Error("Get __INITIAL_STATE__ failed");
  }
  const valueReg = /\{.*\}/;
  const value = valueReg.exec(initValue)?.[0];
  if (!value) {
    throw new Error("parse state failed");
  }
  return JSON.parse(value);
};

const getAllInfos = async (): Promise<WEreadDataInfo> => {
  const url = "https://weread.qq.com/web/shelf";
  const response = await fetch(url);
  const initialState = await response.text();
  if (!initialState) {
    throw new Error("cannot get shelf into, maybe cookie is invalid");
  }
  return parseState(initialState);
};

/**
 * 确保目前在某本书的页面而不是书架等页面
 * @returns boolean
 */
export const checkIsBookPage = async (): Promise<boolean> => {
  const url = (
    await browser.tabs.query({ active: true, currentWindow: true })
  )[0].url;
  if (!url || !url.includes("https://weread.qq.com/web/reader/")) {
    return false;
  }
  return true;
};

const getCurrentBookInfo = async (): Promise<WEreadDataInfo> => {
  const url = (
    await browser.tabs.query({ active: true, currentWindow: true })
  )[0].url;
  if (!url) {
    throw new Error("Get url failed");
  }
  const response = await fetch(url);
  const initialState = await response.text();
  if (!initialState) {
    throw new Error("cannot get book info, maybe cookie is invalid");
  }
  return parseState(initialState);
};

/**
 * 获取划线的内容
 * @param bookId
 * @param type
 * @returns
 */
const getAllBookMark = async (
  bookId: string,
  type: number
): Promise<IBookmarkRootObject> => {
  const url = "https://weread.qq.com/web/book/bookmarklist";
  const response = await fetch(`${url}?bookId=${bookId}&type=${type}`);
  return await response.json();
};

/**
 * 获取想法
 * @param bookId
 * @returns
 */
const getAllBookReviews = async (bookId: string): Promise<IReviews> => {
  const url = "https://weread.qq.com/web/review/list";
  // TODO: 后续了解可用的参数及作用
  // bookId=635942&listType=11&maxIdx=0&count=0&listMode=2&synckey=0&userVid=xxx&mine=1
  const response = await fetch(`${url}?bookId=${bookId}&listType=4&listMode=3`);
  return await response.json();
};

const insertBookMark2ReadWise = async (
  accessToken: string,
  highlights: {
    text: string;
    title?: string;
    author?: string;
    image_url?: string;
    source_url?: string;
    source_type?: string;
    category?: string;
    note?: string;
    location?: number;
    location_type?: string;
    highlighted_at?: string;
    highlight_url?: string;
  }[]
) => {
  const url = "https://readwise.io/api/v2/highlights/";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ highlights }),
  });
  return await response.json();
};

// TODO: 后续支持一次性/勾选导出
export const SyncAllData = async ({
  accessToken,
  setStage,
  setBookCount,
  setStatus,
}: {
  accessToken: string;
  setStage: (stage: string) => void;
  setBookCount: (pageCount: number) => void;
  setStatus: (status: boolean) => void;
}): Promise<void> => {
  setStage("Try to get all infos from weread");
  const value = await getAllInfos();
  const bookIds = value.shelf.shelfIndexes
    .filter((item) => item.role === "book")
    .map((book) => book.bookId)
    .concat(value.shelf.archive.map((archive) => archive.bookIds).flat());
  setBookCount(bookIds.length);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allHighlights: any[] = [];
  setStage("Try to get all bookmarks from weread");
  let allGetCount = 0;
  for (const bookId of bookIds) {
    const bookMarkInfo = await getAllBookMark(bookId, 1);
    const { updated, book } = bookMarkInfo;
    try {
      const hightlights = updated.map(
        (item: { markText: any; range: string; createTime: number }) => {
          return {
            text: item.markText,
            title: book.title,
            author: book.author,
            image_url: book.cover,
            source_type: "weread",
            category: "books",
            // note : "Note",
            location: Number(item.range.split("-")[0]),
            location_type: "order",
            highlighted_at: new Date(item.createTime * 1000).toISOString(),
          };
        }
      );
      allGetCount += 1;
      setStage(
        `Try to get all bookmarks from weread, ${book.title} ${allGetCount}/${bookIds.length}`
      );
      allHighlights = allHighlights.concat(hightlights);
    } catch (error) {
      console.log(`Error when reading book: ${bookId}`);
      console.log(error);
    }
  }
  console.log(`allHighlights.length: ${allHighlights.length}`);
  console.log(allHighlights);
  if (allHighlights.length === 0) {
    setStatus(false);
    console.log("allHighlights.length === 0");
    return;
  }
  setStage("Try to insert all bookmarks to readwise");
  const insertResponse = await insertBookMark2ReadWise(
    accessToken,
    allHighlights
  );
  setStage("Done");
  setStatus(true);
  console.log(insertResponse);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export const syncCurrentBook = async ({
  accessToken,
  setStage,
  setCommentCount,
  setStatus,
}: {
  accessToken: string;
  setStage: (stage: string) => void;
  setCommentCount: (pageCount: number) => void;
  setStatus: (status: boolean) => void;
}): Promise<void> => {
  setStage("Try to get all infos from weread");
  const value = await getCurrentBookInfo();
  const bookId = value.reader.bookId;
  const bookReview = await getAllBookReviews(bookId);
  const bookMarkInfo = await getAllBookMark(bookId, 1);

  const { updated, book, chapters } = bookMarkInfo;
  let allHighlights: any[] = [];
  setStage("Try to get all bookmarks from weread");

  try {
    const reviewHighlights = bookReview.reviews.map(({ review }) => {
      return {
        text: review.abstract,
        title: book.title,
        author: book.author,
        image_url: book.cover,
        source_type: "weread",
        category: "books",
        note: `.${review.chapterTitle.replace(" ", "-")} ${review.content}`,
        location: Number(review.range.split("-")[0]),
        location_type: "order",
        highlighted_at: new Date(review.createTime * 1000).toISOString(),
      };
    });
    const markHighlights = updated.map((item) => {
      return {
        text: item.markText,
        title: book.title,
        author: book.author,
        image_url: book.cover,
        source_type: "weread",
        category: "books",
        note: `.${(
          item.chapterName ||
          chapters.find((chapter) => chapter.chapterUid === item.chapterUid)
            ?.title
        )?.replace(" ", "-")}`,
        location: Number(item.range.split("-")[0]),
        location_type: "order",
        highlighted_at: new Date(item.createTime * 1000).toISOString(),
      };
    });
    allHighlights = uniqBy(reviewHighlights.concat(markHighlights), "text");
    setBookCount(allHighlights.length);
    setStage(
      `Try to get all bookmarks from weread, ${book.title} ${allHighlights.length}`
    );
  } catch (error) {
    console.log(`Error when reading book: ${bookId}`);
    console.log(error);
  }

  setStage("Try to insert all bookmarks to readwise");
  const insertResponse = await insertBookMark2ReadWise(
    accessToken,
    allHighlights
  );
  setStage("Done");
  setStatus(true);
  console.log(insertResponse);
  return;
};

/**
 * @deprecated 直接获取然后填入token，不再由插件自行获取
 */
export const getCsrfmiddlewaretoken = async (): Promise<string> => {
  const url = "https://readwise.io/access_token";
  const response = await fetch(url, {
    credentials: "include", // equivalent to withCredentials: true
  });
  const fetchValueRegex = /name="csrfmiddlewaretoken" value="(.*?)"/;
  const data = await response.text();
  const fetchValue = data.match(fetchValueRegex);
  if (fetchValue) {
    return fetchValue[1];
  }
  throw new Error("getCsrfmiddlewaretoken failed");
};

export const getReadwiseAccessToken = async (): Promise<string> => {
  const tokenFromSync = await storage.getItem<string>(`sync:${READWISE_TOKEN}`);
  if (!tokenFromSync) {
    return (await storage.getItem<string>(`local:${READWISE_TOKEN}`)) || "";
  }
  return tokenFromSync;
};

export const setReadwiseAccessToken = async (
  accessToken: string
): Promise<void> => {
  await Promise.all([
    storage.setItem(`sync:${READWISE_TOKEN}`, accessToken),
    storage.setItem(`local:${READWISE_TOKEN}`, accessToken),
  ]);
};

export const getAndCheckReadwiseAccessToken = async (): Promise<string> => {
  const accessToken = await getReadwiseAccessToken();
  if (!accessToken) {
    return "";
  }
  const isTokenValid = await verifyAccessTokenOfReadwise(accessToken);
  if (!isTokenValid) {
    return "";
  }
  return accessToken;
};

export const getWeReadCookies = async (): Promise<Cookies.Cookie[]> => {
  return browser.cookies.getAll({ url: "https://weread.qq.com/" });
};
