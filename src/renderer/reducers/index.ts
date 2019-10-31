import { combineReducers } from 'redux';

import { application } from './application';
import { builds } from './builds';
import { projects } from './projectsShared';
import { settings } from './settings';

export default combineReducers({
    application,
    builds,
    projects,
    settings
});