import { DefaultColors } from '../../styles/colors';
import { mergeStyleSets } from '@uifabric/styling';
export const CalloutStyle = () => {
    return { width: '596px' };
};
export const AutocompleteStyles = () => {
    return ({ width: '600px', display: 'inline-block' });
};
export const SuggestionListStyle = () => {
    return ({ padding: '4px 16px', fontSize: '14px', cursor: 'default' });
};
export const SuggestionListItemStyle = mergeStyleSets({
    root: {
        selectors: {
            '&:hover': {
                backgroundColor: DefaultColors.Item.ListItemHoverBackgroundColor
            }
        }
    }
});
