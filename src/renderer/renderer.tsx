import '../../node_modules/xterm/css/xterm.css';
import './renderer.css';
import * as React from 'react';
import { Provider } from 'react-redux';
import rootReducer from './reducers';
import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { App } from './containers';
import { configureActions } from './actions';

const loggerMiddleware = createLogger();

const store = createStore(rootReducer, composeWithDevTools(
    applyMiddleware(thunkMiddleware, loggerMiddleware)
));

const Renderer = () => (
    <Provider store={store}>
        <App {...store} />
    </Provider>
);

configureActions(store.dispatch);

export default Renderer;