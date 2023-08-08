import axios from "axios";
import {FC, useState} from "react";
import {CSVLink} from "react-csv";
import {Loader2, SheetIcon, Download} from "lucide-react";

const _URL = process.env.REACT_APP_GOOGLE_SHEET_LINK as string

interface IStatisticData {
    text: string;
    link: string;
}

const ExportData: FC<{ postsData: string[], type: string }> = ({postsData, type}) => {

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendStringsToGoogleSheet = async () => {
        setIsLoading(true)
        let postData = ""
        if (type === "Statistic") {
            const data: IStatisticData[] = []
            postsData.map((post) => {
                const newData = extractLinksFromString(post)
                data.push(
                    newData.length > 0 ? newData[0] : {
                        text: post.replace(/[".]/g, ""), link:
                            ""
                    }
                )
            })
            postData = JSON.stringify(data)
        } else {
            postData = JSON.stringify(postsData)
        }
        const formData = new FormData();
        formData.append("postData", postData);
        formData.append("sheetName", type);

        try {
            const res = await axios.post(_URL, formData);
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    };


    const csvData = [
        ["Posts"],
        ...postsData.map((post) => [
            post
        ]),
    ];

    // const handleDownload = () => {
    //     const data = postsData.map(str => [str])
    //     const csvData = papa.unparse(data, { header: false });
    //     const blob = new Blob([csvData], { type: 'text/csv' });
    //     saveAs(blob, 'data.csv');
    // };
    const extractLinksFromString = (text: string): { link: string; text: string }[] => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (!matches) return [];
        // Extract link and text before it for each match
        const extractedLinks = matches.map((link) => {
            const index = text.indexOf(link);
            return {
                text: text.substring(0, index).replace(/[".]/g, ""),
                link,
            };
        });
        return extractedLinks;
    };


    return (
        <div className="py-4">
            <button onClick={sendStringsToGoogleSheet}
                    className="inline-flex items-center gap-2 text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                    disabled={isLoading}
            >
                {!isLoading ? <SheetIcon width={20}/> :
                    <Loader2 className="animate-spin" width={20}/>
                }
                Export To Google Sheet
            </button>

            <CSVLink

                className="inline-flex items-center gap-2 text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:focus:ring-yellow-900 "

                data={csvData}
                filename="Posts.csv">
                <Download width={20}/>
                <span>Export to CSV</span>

            </CSVLink>
        </div>
    )
}

export default ExportData;