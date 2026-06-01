import React from 'react';

export const ImageLoadingPlaceholder = () => (
  <div className="img-placeholder">
    <div className="img-spinner"></div>
    <div className="img-placeholder-text">Generating</div>
  </div>
);
const getDisplayBrandName = (store) => {
  const names = [
    store.name,
    store.store_name,
    store.storeData?.title,
    (store.customSchema || store.schema)?.metadata?.brand_identity,
    (store.customSchema || store.schema)?.layout?.find(s => s.type === "hero")?.props?.title
  ];
  for (const n of names) {
    if (n && n !== "New AI Store" && n !== "AI Store") return n;
  }
  return store.name || store.store_name || "New AI Store";
};
