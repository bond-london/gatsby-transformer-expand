# Gatsby object expander

This takes documents and expands them - very useful in conjunction with the json loader to simulate a cms

If the json structure has a type and module field, the type is used to generate the new node type using the contents of the module object for the contents

e.g.

```
{
    "type": "Component 1",
    "module": {
        "title": "This is component 1",
        "messages": [
            "Message 1",
            "Message 2"
        ]
    }
}
```

It produces the graphql objects 'docComponent1' with the contents

```
{
    "title": "This is component 1",
    "messages": [
        "Message 1",
        "Message 2"
    ]
}
```
