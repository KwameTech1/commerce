export const SITE_NAME = process.env.SITE_NAME || "RareCart";
export const COMPANY_NAME = process.env.COMPANY_NAME || "RareCart";
export const DEFAULT_EVERSEND_PAYMENT_TAG_URL = "https://eversend.me/maxcards";
export const EVERSEND_PAYMENT_TAG_URL =
  process.env.EVERSEND_PAYMENT_TAG_URL || DEFAULT_EVERSEND_PAYMENT_TAG_URL;
export const IS_DEFAULT_PAYMENT_TAG =
  EVERSEND_PAYMENT_TAG_URL === DEFAULT_EVERSEND_PAYMENT_TAG_URL;
export const DEFAULT_CURRENCY = "GHS";
