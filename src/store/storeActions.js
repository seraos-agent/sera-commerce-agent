export const createSetter = (dispatch, key) => (payload) => {
  dispatch({ type: 'SET_STATE', key, payload });
};

// Add other complex business actions here later
export const addToCart = (dispatch, item) => {
  dispatch({ type: 'ADD_TO_CART', payload: item });
};

export const removeFromCart = (dispatch, index) => {
  dispatch({ type: 'REMOVE_FROM_CART', payload: index });
};
