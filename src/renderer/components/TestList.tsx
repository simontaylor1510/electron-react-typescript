import * as React from 'react';
import {
    DetailsList,
    Selection,
    SelectionMode,
    IColumn,
    DetailsListLayoutMode
} from 'office-ui-fabric-react/lib/DetailsList';

interface IDocument {
    project: string;
    details: string;
    key: string
}

export class TestList extends React.Component {
    private _selection: Selection;
    private _items: any[] = [
        {
            project: 'Library.Testing.Database',
            details: 'Stuff',
            key: '1'
        } as IDocument,
        {
            project: 'Library.Testing.Database.ejFlight',
            details: 'Stuff',
            key: '2'
        } as IDocument
    ];
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

    constructor(props: any) {
        super(props);

        this._selection = new Selection({
            onSelectionChanged: () => {
                this.setState({
                    selectionDetails: this._getSelectionDetails()
                });
            }
        });

        this.state = {
            items: this._items,
            columns: this._columns,
            selectionDetails: this._getSelectionDetails(),
            isModalSelection: false,
            isCompactMode: false,
            announcedMessage: undefined
        };
    }

    public render() {
        return (
            <div>
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
            </div>
        );
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
