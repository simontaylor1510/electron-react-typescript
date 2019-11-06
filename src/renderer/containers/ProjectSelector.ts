import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { GlobalState, ProjectSelectorProps } from '../types';
import { TestList } from '../components/TestList';

export function mapStateToProps(state: GlobalState, _: Dispatch) {
    return {
        allProjects: state.projects.allProjects,
        allLocalProjects: state.projects.allLocalProjects
    } as ProjectSelectorProps;
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TestList);

