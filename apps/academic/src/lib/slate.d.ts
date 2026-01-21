import type { BaseEditor } from "slate";
import type { HistoryEditor } from "slate-history";
import type { ReactEditor } from "slate-react";

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

export type LinkElement = {
  type: "link";
  url: string;
  children: CustomText[];
};

export type ListItemElement = {
  type: "list-item";
  children: Array<CustomText | LinkElement>;
};

export type BulletedListElement = {
  type: "bulleted-list";
  children: ListItemElement[];
};

export type NumberedListElement = {
  type: "numbered-list";
  children: ListItemElement[];
};

export type CustomElement =
  | ParagraphElement
  | LinkElement
  | ListItemElement
  | BulletedListElement
  | NumberedListElement;

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
