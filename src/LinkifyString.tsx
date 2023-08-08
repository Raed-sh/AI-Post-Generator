import React from "react";

interface LinkifyStringProps {
    inputString: string;
}

export const LinkifyString: React.FC<LinkifyStringProps> = ({ inputString }) => {
    // Define a regular expression pattern to match links
    const linkPattern = /((?:https?:\/\/|www\.)\S+)/g;

    // Split the inputString into parts using the linkPattern
    const parts = inputString.split(linkPattern);

    // Wrap the links in <a> tags
    const updatedString = parts.map((part, index) => {
        if (linkPattern.test(part)) {
            const href = part.startsWith('www.') ? `http://${part}` : part;
            return (
                <a href={href} key={index} className={"underline text-purple-300"} target="_blank"
                    rel="noopener noreferrer">
                    {part}
                </a>
            );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });

    return <>{updatedString}</>;
};