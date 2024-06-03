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
  chapterName?: string;
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

export interface IReviews {
  synckey: number;
  totalCount: number;
  reviews: IReview[];
  removed: any[];
  atUsers: any[];
  refUsers: any[];
  columns: any[];
  hasMore: number;
}

export interface IReview {
  reviewId: string;
  review: {
    type: number;
    bookId: string;
    chapterUid: number;
    content: string;
    bookVersion: number;
    isPrivate: number;
    abstract: string;
    range: string;
    reviewId: string;
    userVid: number;
    topics: any[];
    createTime: number;
    isLike: number;
    isReposted: number;
    book: IBook;
    chapterIdx: number;
    chapterTitle: string;
    author: IAuthor;
  };
}

export interface IBook {
  bookId: string;
  format: string;
  version: number;
  soldout: number;
  bookStatus: number;
  type: number;
  cover: string;
  title: string;
  author: string;
  translator?: string;
  payType: number;
}

export interface IAuthor {
  userVid: number;
  name: string;
  avatar: string;
  isFollowing: number;
  isFollower: number;
  isBlacking: number;
  isBlackBy: number;
  isHide: number;
  nick: string;
  isV: number;
  roleTags: any[];
  followPromote: string;
  signature: string;
}

export interface IBookmarkRootObject {
  synckey: number;
  updated: IBookmarkUpdated[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removed: any[];
  chapters: IBookmarkChapter[];
  book: IBookmarkBook;
}

export interface WEreadDataInfo {
  OS: string;
  platform: string;
  deviceInfo: string;
  httpReferer: string;
  error: null;
  user: WEreadDataInfoUser;
  isWhiteTheme: boolean;
  isNavBarShown: boolean;
  isFooterShown: boolean;
  isShelfFullShown: boolean;
  pageName: string;
  pageTitle: string;
  pageKeywords: string;
  pageDescription: string;
  pageBodyClass: string;
  customReaderStyle: string;
  environment: string;
  sState: SState;
  route: Route;
  shelf: WEreadDataInfoShelf;
  reader: WEreadDataInfoReader;
}

export interface Route {
  path: string;
  hash: string;
  query: Meta;
  params: Meta;
  fullPath: string;
  meta: Meta;
  from?: Route;
  name?: null;
}

export interface Meta {}

export interface SState {
  user: SStateUser;
  shelf?: SStateShelf;
  /**
   * 这里的reader里的bookId不一定对，不要用sState里的
   * TODO: 找一下原因
   */
  reader?: SStateReader;
}

export interface SStateShelf {
  books: any[];
}

export interface SStateReader {
  bookId: string;
  bookInfo: {
    bookId: string;
    title: string;
    author: string;
    cover: string;
    format: "epub" | string;
    price: number;
    updateTime: number;
    publisher: string;
    star: number;
    ratingCount: number;
  };
}
export interface SStateUser {
  vid: Vid;
  avatar: string;
  name: string;
}

export interface Vid {
  vid: number;
}

export interface WEreadDataInfoShelf {
  miniShelf: any[];
  archive: any[];
  books: any[];
  bookProgress: any[];
  balanceIOS: number;
  balanceAndroid: number;
  memberCardSummary: Meta;
  booksAndArchives: BooksAndArchive[];
  rawBooks: RawBook[];
  loadingMore: boolean;
  rawIndexes: Index[];
  shelfIndexes: Index[];
  updatedBooks: any[];
}

export interface WEreadDataInfoReader {
  bookId: string;
}

export interface BooksAndArchive {
  bookId: string;
  title: string;
  author: string;
  translator?: string;
  cover: string;
  version: number;
  format: Format;
  type: Type;
  price: number;
  originalPrice: number;
  soldout: number;
  bookStatus: number;
  payType: number;
  payingstatus: number;
  centPrice: number;
  finished: number;
  maxFreeChapter: number;
  free: number;
  mcardDiscount: number;
  ispub: number;
  extra_type?: number;
  lastChapterCreateTime: number;
  publishTime: string;
  category?: string;
  categories?: Category[];
  hasLecture: number;
  lastChapterIdx: number;
  paperBook: PaperBook;
  blockSaveImg: number;
  language: Language;
  hideUpdateTime: boolean;
  newRating: number;
  newRatingCount: number;
  newRatingDetail: NewRatingDetail;
  secret: number;
  readUpdateTime: number;
  finishReading: number;
  paid?: number;
  updateTime: number;
  bookType: number;
  isAudio: boolean;
  isTrial: boolean;
  hide: boolean;
  indexId: string;
  shouldHideTTS?: number;
  authorvid?: number;
  mpAuthorName?: string;
  limitShareChat?: number;
  lPushName?: string;
  authorVids?: string;
}

export interface Category {
  categoryId: number;
  subCategoryId: number;
  categoryType: number;
  title: string;
}

export enum Format {
  Epub = "epub",
  Txt = "txt",
}

export enum Language {
  Zh = "zh",
  ZhCN = "zh-CN",
}

export interface NewRatingDetail {
  good: number;
  fair: number;
  poor: number;
  recent: number;
  title: string;
}

export interface PaperBook {
  skuId: string;
}

export enum Type {
  Book = "book",
}

export interface RawBook {
  bookId: string;
  title: string;
  author: string;
  translator?: string;
  cover: string;
  version: number;
  format: Format;
  type: number;
  price: number;
  originalPrice: number;
  soldout: number;
  bookStatus: number;
  payType: number;
  payingstatus: number;
  centPrice: number;
  finished: number;
  maxFreeChapter: number;
  free: number;
  mcardDiscount: number;
  ispub: number;
  extra_type?: number;
  lastChapterCreateTime: number;
  publishTime: string;
  category?: string;
  categories?: Category[];
  hasLecture: number;
  lastChapterIdx: number;
  paperBook: PaperBook;
  blockSaveImg: number;
  language: Language;
  hideUpdateTime: boolean;
  newRating: number;
  newRatingCount: number;
  newRatingDetail: NewRatingDetail;
  secret: number;
  readUpdateTime: number;
  finishReading: number;
  paid?: number;
  updateTime: number;
  shouldHideTTS?: number;
  authorvid?: number;
  mpAuthorName?: string;
  limitShareChat?: number;
  lPushName?: string;
  authorVids?: string;
}

export interface Index {
  bookId: string;
  type: number;
  idx: number;
  role: Type;
}

export interface WEreadDataInfoUser {
  vid: number;
  skey: string;
  name: string;
  avatar: string;
  gender: number;
  pf: number;
}
