import * as React from 'react';

import {
    initializeIcons,
    loadTheme
} from 'office-ui-fabric-react';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';

const getItems = () => {
    return [
        {
            key: 'newItem',
            name: 'New',
            cacheKey: 'myCacheKey', // changing this key will invalidate this items cache
            iconProps: {
                iconName: 'Add'
            },
            ariaLabel: 'New',
            subMenuProps: {
                items: [
                    {
                        key: 'emailMessage',
                        name: 'Email message',
                        iconProps: {
                            iconName: 'Mail'
                        },
                    },
                    {
                        key: 'calendarEvent',
                        name: 'Calendar event',
                        iconProps: {
                            iconName: 'Calendar'
                        }
                    }
                ]
            }
        },
        {
            key: 'upload',
            name: 'Upload',
            iconProps: {
                iconName: 'Upload'
            },
            href: 'https://dev.office.com/fabric',
        },
        {
            key: 'share',
            name: 'Share',
            iconProps: {
                iconName: 'Share'
            },
            onClick: () => console.log('Share')
        },
        {
            key: 'download',
            name: 'Download',
            iconProps: {
                iconName: 'Download'
            },
            onClick: () => console.log('Download')
        }
    ];
};

export class App extends React.Component {
    constructor(props: any) {
        super(props);

        initializeIcons();
        loadTheme({
            palette: {
                black: '#f9f9f9',
                neutralDark: '#f4f4f4',
                neutralLight: '#252525',
                neutralLighter: '#151515',
                neutralLighterAlt: '#0b0b0b',
                neutralPrimary: '#d2d1d0',
                neutralPrimaryAlt: '#eaeae9',
                neutralQuaternary: '#373737',
                neutralQuaternaryAlt: '#2f2f2f',
                neutralSecondary: '#e5e5e4',
                neutralTertiary: '#e0dfdf',
                neutralTertiaryAlt: '#595959',
                themeDark: '#3595de',
                themeDarkAlt: '#1684d8',
                themeDarker: '#66afe7',
                themeLight: '#00243f',
                themeLighter: '#001322',
                themeLighterAlt: '#000508',
                themePrimary: '#0078d4',
                themeSecondary: '#006aba',
                themeTertiary: '#00487f',
                white: '#000000',
            }
        });
    }

    public render() {
        return (
            <React.Fragment>
                <Pivot>
                    <PivotItem
                        id='pivotItem.Service.FlightGetComments'
                        headerText='Service.FlightGetComments'>
                        <CommandBar items={getItems()} />
                        <div id='terminal' style={{ backgroundColor: 'grey', height: 'calc(100vh - 118px)' }} />
                    </PivotItem>
                    <PivotItem
                        id='pivotItem.Library.Testing.Database'
                        headerText='Library.Testing.Database'>
                        <CommandBar items={getItems()} />
                        <div id='terminal' style={{ backgroundColor: 'pink', height: 'calc(100vh - 118px)' }} />
                    </PivotItem>
                </Pivot>
            </React.Fragment>
        );
    }
}