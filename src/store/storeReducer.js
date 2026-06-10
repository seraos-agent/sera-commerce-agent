export const initialState = {
  appMode: "seller", // "buyer" | "seller"
  storeSchema: null,
  draftSchema: null,
  publishedSchema: null,
  userStores: [],
  activeAnalyticsStoreId: "",
  analyticsData: null,
  isLoadingAnalytics: false,
  buyerSearchQuery: "",
  buyerAiQuery: "",
  buyerAiMessages: [{ role: "agent", text: "What are you looking for today?", action: "idle", hasAction: false }],
  buyerAiStatus: "",
  selectedCategoryFilter: "all",
  followedStores: new Set(["urban-essentials"]),
  cart: [],
  isCartOpen: false,
  selectedProductDetail: null,
  selectedStorefront: null,
  modalQty: 1,
  selectedPhilosophy: null,
  toastMessage: ""
};

export function storeReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      // Flexible action to update any state property (replicates setState behavior)
      return {
        ...state,
        [action.key]: typeof action.payload === 'function' 
          ? action.payload(state[action.key]) 
          : action.payload
      };
    case 'ADD_TO_CART':
      return {
        ...state,
        cart: [...state.cart, action.payload]
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((_, i) => i !== action.payload)
      };
    default:
      return state;
  }
}
