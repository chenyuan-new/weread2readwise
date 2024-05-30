import { WEreadDataInfo } from "./interface";
import { browser, Cookies, Tabs } from "wxt/browser";

export interface IBookmarkUpdated {
  bookId: string;
  style: number;
  bookVersion: number;
  range: string;
  markText: string;
  type: number;
  chapterUid: number;
  createTime: number;
  bookmarkId: string;
}

export interface IBookmarkChapter {
  bookId: string;
  chapterUid: number;
  chapterIdx: number;
  title: string;
}

export interface IBookmarkBook {
  bookId: string;
  version: number;
  format: string;
  soldout: number;
  bookStatus: number;
  cover: string;
  title: string;
  author: string;
}

export interface IBookmarkRootObject {
  synckey: number;
  updated: IBookmarkUpdated[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removed: any[];
  chapters: IBookmarkChapter[];
  book: IBookmarkBook;
}
const getAllInfos = async (): Promise<WEreadDataInfo> => {
  const url = "https://weread.qq.com/web/shelf";
  const response = await fetch(url);
  const pageInfo = await response.json();
  if (!pageInfo) {
    throw new Error("cookie is invalid");
  }
  const initValueReg = /window.__INITIAL_STATE__=(\{[\s\S]*?\});/;
  const initValue = initValueReg.exec(pageInfo)?.[0];
  if (!initValue) {
    throw new Error("Get __INITIAL_STATE__ failed");
  }
  const valueReg = /\{.*\}/;
  const value = valueReg.exec(initValue)?.[0];

  console.log(valueReg.exec(initValue));
  console.log(value);
  if (!value) {
    throw new Error("Get info failed");
  }

  return JSON.parse(value);
};

const getAllBookMark = async (
  bookId: string,
  type: number
): Promise<IBookmarkRootObject> => {
  const url = "https://weread.qq.com/web/book/bookmarklist";
  const response = await fetch(`${url}?bookId=${bookId}&type=${type}`);
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
  const url = "https://readwise.io/access_token";
  const csrfmiddlewaretoken = await getCsrfmiddlewaretoken();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrfmiddlewaretoken,
    },
    credentials: "include",
    body: new URLSearchParams({
      get_token: "Get Access Token",
    }),
  });
  const data = await response.text();
  const fetchValueRegex = /readonly value="(.*?)"/;
  const fetchValue = data.match(fetchValueRegex);
  if (fetchValue) {
    return fetchValue[1];
  }
  throw new Error("getReadwiseAccessTokenByPage failed");
};

export const getWeReadCookies = async (): Promise<Cookies.Cookie[]> => {
  return browser.cookies.getAll({ url: "https://weread.qq.com/" });
};
