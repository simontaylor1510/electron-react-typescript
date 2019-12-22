import * as React from 'react';
import {
    PrimaryButton
} from 'office-ui-fabric-react/lib/Button';
import {
    DetailsList,
    Selection,
    SelectionMode,
    IColumn,
    DetailsListLayoutMode,
    IGroup
} from 'office-ui-fabric-react/lib/DetailsList';
import { Autocomplete, ISuggestionItem } from './Autocomplete';
import { ProjectSelectorProps, Project } from '../types';

interface IDocument {
    details: string;
    key: string
    project: string;
}

interface IProjectSelectorState {
    columns: IColumn[];
    items: IDocument[];
    searchText: string | undefined;
    selectionDetails: string;
    suggestionText: string | undefined;
}

export class ProjectSelector extends React.Component<ProjectSelectorProps, IProjectSelectorState> {
    private _searchData: ISuggestionItem[] = [];
    private _selection: Selection;
    private _items: IDocument[] = [];
    private _columns: IColumn[] = [
        {
            name: 'Repository',
            fieldName: 'project',
            key: 'col1'
        } as IColumn,
        {
            name: 'Details',
            fieldName: 'details',
            key: 'col2'
        } as IColumn
    ];
    private _groups: IGroup[] = [
        {
            key: 'OpenWindows',
            count: this._items.length,
            startIndex: 0,
            isCollapsed: false,
            name: 'Open Terminal Windows'
        } as IGroup,
        {
            key: 'ReposWithChanges',
            count: 0,
            startIndex: this._items.length,
            name: 'Repositories with remote changes',
            isCollapsed: true,
        } as IGroup,
        {
            key: 'NewRepos',
            count: 0,
            startIndex: this._items.length,
            name: 'NEW Repositories',
            isCollapsed: true,
        } as IGroup
    ];

    constructor(props: ProjectSelectorProps) {
        super(props);

        this._selection = new Selection({
            onSelectionChanged: () => {
                this.setState({
                    selectionDetails: this._getSelectionDetails()
                });
            }
        });

        this.state = {
            columns: this._columns,
            selectionDetails: this._getSelectionDetails(),
            searchText: undefined,
            suggestionText: undefined
        } as IProjectSelectorState;

        this.updateItems();
        this.updateSearchData();
    }

    public componentDidUpdate() {
        this.updateItems();
        this.updateSearchData();
    }

    public render() {
        return (
            <React.Fragment>
                <React.Fragment>
                    <Autocomplete
                        items={this._searchData}
                        searchCallback={item => this.searchCallback(item)}
                        suggestionCallback={item => this.suggestionCallback(item)}
                        searchTitle='Repository name ...' />
                    <PrimaryButton
                        text='Open Terminal' style={{ float: 'right' }} disabled={!this.state.suggestionText}
                        onClick={() => this.openTerminal()} />
                </React.Fragment>
                <DetailsList
                    items={this._items}
                    compact={true}
                    columns={this._columns}
                    groups={this._groups}
                    selectionMode={SelectionMode.single}
                    getKey={this._getKey}
                    setKey='single'
                    layoutMode={DetailsListLayoutMode.justified}
                    isHeaderVisible={true}
                    selection={this._selection}
                    selectionPreservedOnEmptyClick={true}>
                </DetailsList>
            </React.Fragment>
        );
    }

    private updateItems(): void {
        let items: IDocument[] = [];

        this.props.openTerminals.forEach((_, key) => {
            items.push({
                key,
                project: key
            } as IDocument);
        });
        this.props.dirtyProjects
            .filter(lp => !this.props.openTerminals.has(lp.name))
            .forEach((p) => {
                items.push({
                    key: p.name,
                    project: p.name
                } as IDocument);
            });
        items = items.sort((lp1, lp2) => lp1.key.localeCompare(lp2.key));

        this._groups[0].count = items.length;
        this._groups[0].startIndex = 0;

        this._groups[1].startIndex = items.length;
        var reposWithChangesCount = 0;
        this.props.outOfDateProjects
            .sort((lp1, lp2) => lp1.name.localeCompare(lp2.name))
            .forEach((lp) => {
                items.push({
                    key: lp.name,
                    project: lp.name
                } as IDocument);
            reposWithChangesCount++;
        });
        this._groups[1].count = reposWithChangesCount;

        this._groups[2].startIndex = items.length;
        var newReposCount = 0;
        this.props.newProjects
            .sort((lp1, lp2) => lp1.name.localeCompare(lp2.name))
            .forEach((p) => {
                items.push({
                    key: p.name,
                    project: p.name
                } as IDocument);
            newReposCount++;
        });
        this._groups[2].count = newReposCount;

        this._items = items;
    }

    private openTerminal(): void {
        this.props.openTerminal();
    }

    private updateSearchData() {
        this._searchData = this.props.allLocalProjects.map(lp => { 
            const project = this.props.allProjects.find(p => p.name === lp.name) || {} as Project;
            return {
                key: project.id,
                displayValue: lp.name,
                searchValue: lp.name
            } as ISuggestionItem 
        });
    }

    private searchCallback(item: string) {
        this.setState({ searchText: item });
    }

    private suggestionCallback(item: ISuggestionItem | undefined) {
        this.setState({ suggestionText: item && item.searchValue !== '' ? item.searchValue : undefined });
        if (item && item.searchValue !== '') {
            this.props.repoSelected(item.searchValue);
        }
    }

    private _getSelectionDetails(): string {
        const selectionCount = this._selection.getSelectedCount();

        switch (selectionCount) {
            case 0:
                return 'No items selected';
            case 1:
                return '1 item selected: ' + (this._selection.getSelection()[0] as IDocument).project;
            default:
                return `${selectionCount} items selected`;
        }
    }

    private _getKey(item: any, index?: number): string {
        return item.key;
    }
}
