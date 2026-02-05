// for creating slice and Async Thunk
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// firebase database
import { db } from "../../firebaseInit";
import { updateDoc, doc, arrayUnion, onSnapshot, arrayRemove } from "firebase/firestore";

// for toast notifications
import { toast } from "react-toastify";

// return date in yy/mm/dd format
function getDate() {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return (`${year}-${month}-${day}`);
}

// async thunk to get initial data of cart items and orders placed by user from database
export const getInitialCartOrdersThunk = createAsyncThunk(
    'product/getCartOrders',
    (args, thunkAPI) => {
        const { authReducer } = thunkAPI.getState();
        const { isLoggedIn, userLoggedIn } = authReducer;

        if (isLoggedIn) {
            const unsub = onSnapshot(doc(db, "buybusy-redux", userLoggedIn.id), (doc) => {
                const data = doc.data();
                if (data) {
                    thunkAPI.dispatch(setCart(data.cart));
                    thunkAPI.dispatch(setMyOrders(data.orders));
                }
            });
            return () => unsub();
        }
    }
);

// async thunk to update cart inside the database
const updateCartInDatabase = createAsyncThunk(
    'product/updateCartInDatabase',
    async (args, thunkAPI) => {
        const { authReducer, productReducer } = thunkAPI.getState();
        const { userLoggedIn } = authReducer;

        const userRef = doc(db, "buybusy-redux", userLoggedIn.id);
        await updateDoc(userRef, {
            cart: productReducer.cart
        });
    }
);

// async thunk for adding a new product to the cart
export const addToCartThunk = createAsyncThunk(
    "product/addToCart",
    async (product, thunkAPI) => {
        const { authReducer, productReducer } = thunkAPI.getState();
        const { isLoggedIn, userLoggedIn } = authReducer;

        if (!isLoggedIn) {
            toast.error("Please first Login !!!");
            return;
        }

        const index = productReducer.cart.findIndex((item) => item.name === product.name);
        if (index !== -1) {
            thunkAPI.dispatch(increaseQuantThunk(productReducer.cart[index]));
            toast.success("Product Quantity Increased!!");
            return;
        }

        const userRef = doc(db, "buybusy-redux", userLoggedIn.id);
        await updateDoc(userRef, {
            cart: arrayUnion({ quantity: 1, ...product })
        });

        thunkAPI.dispatch(increaseTotalAmount(product.price));
        thunkAPI.dispatch(increaseTotalItem());

        thunkAPI.dispatch(updateCartInDatabase()); // Ensure the database is updated

        toast.success("Added to your Cart!!");
    }
);

// increase product quantity in cart and database
export const increaseQuantThunk = createAsyncThunk(
    "product/increaseProductQuantity",
    async (product, thunkAPI) => {
        const { productReducer } = thunkAPI.getState();
        const index = productReducer.cart.findIndex((item) => item.name === product.name);

        thunkAPI.dispatch(increaseProductQuantity(index));
        thunkAPI.dispatch(increaseTotalAmount(product.price));
        thunkAPI.dispatch(updateCartInDatabase());
    }
);

// decrease product quantity in cart and database
export const decreaseQuantThunk = createAsyncThunk(
    "product/decreaseProductQuantity",
    async (product, thunkAPI) => {
        const { productReducer } = thunkAPI.getState();
        const index = productReducer.cart.findIndex((item) => item.name === product.name);

        if (productReducer.cart[index].quantity === 1) {
            thunkAPI.dispatch(removeFromCartThunk(product));
            return;
        }

        thunkAPI.dispatch(decreaseProductQuantity(index));
        thunkAPI.dispatch(reduceTotalAmount(productReducer.cart[index].price));
        thunkAPI.dispatch(updateCartInDatabase());
    }
);

// remove product from the cart
export const removeFromCartThunk = createAsyncThunk(
    "product/removeFromCart",
    async (product, thunkAPI) => {
        const { authReducer } = thunkAPI.getState();
        const { userLoggedIn } = authReducer;

        const userRef = doc(db, "buybusy-redux", userLoggedIn.id);
        await updateDoc(userRef, {
            cart: arrayRemove(product)
        });

        return product;
    }
);

// async thunk to remove all the products from the cart
export const clearCartThunk = createAsyncThunk(
    "product/emptyCart",
    async (args, thunkAPI) => {
        const { authReducer, productReducer } = thunkAPI.getState();
        const { userLoggedIn } = authReducer;

        if (productReducer.itemInCart === 0) {
            toast.error("Nothing to remove in Cart!!");
            return;
        }

        const userRef = doc(db, "buybusy-redux", userLoggedIn.id);
        await updateDoc(userRef, {
            cart: []
        });

        toast.success("Empty Cart!!");
    }
);

// async thunk to purchase all the product inside the cart
export const purchaseAllThunk = createAsyncThunk(
    "product/purchaseAllItems",
    async (args, thunkAPI) => {
        const { authReducer, productReducer } = thunkAPI.getState();
        const { userLoggedIn } = authReducer;

        const currentDate = getDate();

        const userRef = doc(db, "buybusy-redux", userLoggedIn.id);
        await updateDoc(userRef, {
            orders: arrayUnion({
                date: currentDate,
                list: productReducer.cart,
                amount: productReducer.total
            })
        });

        thunkAPI.dispatch(clearCartThunk());
    }
);

const productSlice = createSlice({
    name: "product",
    initialState: {
        cart: [],
        itemInCart: 0,
        myorders: [],
        total: 0,
    },
    reducers: {
        setMyOrders: (state, action) => {
            state.myorders = action.payload;
        },
        increaseProductQuantity: (state, action) => {
            const index = action.payload;
            state.cart[index].quantity++;
        },
        decreaseProductQuantity: (state, action) => {
            const index = action.payload;
            state.cart[index].quantity--;
        },
        setCart: (state, action) => {
            state.cart = action.payload;
            if (state.cart) {
                let sum = 0, len = 0;
                state.cart.forEach((item) => {
                    sum += item.price * item.quantity;
                    len += item.quantity;
                });
                state.total = sum;
                state.itemInCart = len;
            }
        },
        increaseTotalItem: (state) => {
            state.itemInCart++;
        },
        increaseTotalAmount: (state, action) => {
            state.total += action.payload;
        },
        reduceTotalAmount: (state, action) => {
            state.total -= action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getInitialCartOrdersThunk.fulfilled, (state, action) => {
                // The logic has been moved to setCart to handle real-time updates correctly
            })
            .addCase(increaseQuantThunk.fulfilled, (state) => {
                state.itemInCart++;
            })
            .addCase(decreaseQuantThunk.fulfilled, (state) => {
                if (state.itemInCart > 1) {
                    state.itemInCart--;
                }
            })
            .addCase(removeFromCartThunk.fulfilled, (state, action) => {
                const product = action.payload;
                state.total -= product.quantity * product.price;
                state.itemInCart -= product.quantity;
                toast.success("Removed from Cart!!");
            })
            .addCase(clearCartThunk.fulfilled, (state) => {
                state.itemInCart = 0;
                state.total = 0;
                state.cart = [];
            });
    }
});

// exporting the reducer of slice
export const productReducer = productSlice.reducer;

// exporting all the actions of reducer
export const { setMyOrders, increaseProductQuantity, decreaseProductQuantity, setCart, increaseTotalItem, increaseTotalAmount, reduceTotalAmount } = productSlice.actions;

// exporting the state of reducer to get data
export const productSelector = (state) => state.productReducer;
