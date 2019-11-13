import * as React from 'react';
import {
    PrimaryButton
} from 'office-ui-fabric-react/lib/Button';
import {
    DetailsList,
    Selection,
    SelectionMode,
    IColumn,
    DetailsListLayoutMode
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
        const items: IDocument[] = [];

        this.props.openTerminals.forEach((value, key) => {
            items.push({
                key,
                project: key
            } as IDocument);
        })

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
