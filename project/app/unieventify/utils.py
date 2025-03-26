import json
from draftjs_exporter.html import HTML

def convert_draftjs_to_html(draft_content):
    """
    Converts the Draft.js raw JSON content into HTML.
    """
    exporter = HTML({
        'block_map': {
            'unstyled': {'element': 'p'},
            'header-one': {'element': 'h1'},
            'header-two': {'element': 'h2'},
            'header-three': {'element': 'h3'},
            'blockquote': {'element': 'blockquote'},
            'unordered-list-item': {'element': 'li', 'wrapper': 'ul'},
            'ordered-list-item': {'element': 'li', 'wrapper': 'ol'},
            'code-block': {'element': 'pre'},
        },
        'style_map': {
            'BOLD': {'element': 'strong'},
            'ITALIC': {'element': 'em'},
            'UNDERLINE': {'element': 'u'},
            'STRIKETHROUGH': {'element': 'del'},
        },
        'entity_decorators': {
            'LINK': lambda props: f'<a href="{props["url"]}">{props["children"]}</a>',
            'IMAGE': lambda props: f'<img src="{props["src"]}" alt="{props.get("alt", "")}" />',
        },
    })

    try:
        content = json.loads(draft_content)  # Parse the Draft.js JSON content
        html = exporter.render(content)     # Convert to HTML
        return html
    except (json.JSONDecodeError, KeyError) as e:
        # Handle invalid Draft.js JSON content gracefully
        return ""