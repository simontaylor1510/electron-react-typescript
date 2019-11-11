import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { RepoSelected, OpenTerminal } from '../actions/application';

import { GlobalState, ProjectSelectorProps } from '../types';
import { ProjectSelector } from '../components/ProjectSelector';

export function mapStateToProps(state: GlobalState, _: Dispatch) {
    return {
        allProjects: state.projects.allProjects,
        allLocalProjects: state.projects.allLocalProjects
    } as ProjectSelectorProps;
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    repoSelected: (repoName: string) => RepoSelected(dispatch, repoName),
    openTerminal: () => OpenTerminal(dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectSelector);

