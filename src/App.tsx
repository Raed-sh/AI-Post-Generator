import React, {FC, useState} from 'react';
import {Configuration, OpenAIApi} from "openai";
import ExportData from './ExportData';
import {Loader} from './Loader';
import {LinkifyString} from './LinkifyString';

interface IPosts {
    postType: string;
    topic: string
    number: string;
}


const Prompt = ({postType, topic, number}: IPosts): string => {
    if (!number || !topic) return "";
    switch (postType) {
        case "Social Media":
            return (
                `As a professional content creator, I specialize in crafting diverse and engaging social media posts. Generate ${number} unique, succinct posts spotlighting various aspects of ${topic}. Present in a list format, adhering to outlined restrictions. Ensure each post remains within 10 to 50 words, devoid of duplication from previous responses or the current output. Exclude numbering, quotations, dots, emojis, and hashtags. Deliver captivating and distinctive descriptions. Example inspiration:

            - Philosophy, a bridge connecting myriad strands of thought.
            - Navigate life's waters with philosophy as your compass.
            - Witness basketball courts burst with vibrant energy.
            - Soccer speaks a universal language through exhilarating matches.`
            )
        case "Statistic":
            return (
                `In the role of a data analyst, I compile insightful statistics on various subjects. Generate a set of ${number} statistical insights about ${topic}. Present in a list format, adhering to outlined restrictions. Provide numbers, percentages, or ratios where relevant. Keep each statistic concise, within 10 to 50 words, and avoid duplications from previous responses or the current output.
                Please also provide a link to reference after the statistic, separated by semi colon.
                Example inspiration:

                - ${topic} experiences a staggering 30% annual growth rate.
                - A remarkable 75% of individuals surveyed prefer [feature].
                - In the past year, [event] contributed to a 20% increase in [outcome].
                `
            );
        default:
            return "";
    }
}


function App() {
    const [posts, setPosts] = useState<IPosts>({
        number: "",
        topic: "",
        postType: ""
    });

    const max_value: number = 100;

    const [data, setData] = useState<string[]>([]);
    const [errors, setErrors] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false)

    const configuration = new Configuration({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY
    });

    const formatPostText = (text: string, postType: string) => {
        const hashtagRegex = /#\w+/g;
        const numberAndSpecialRegex = /^[a-zA-Z-0-9-%!?\-']+/;
        const dotAndQuotesRegex = /[".]/g;
        const quotesRegex = /["]/g;
        text = text.replace(numberAndSpecialRegex, '')
        text = text.replace(hashtagRegex, '')
        if (postType === "Statistic") {
            return text.replace(quotesRegex, '');
        }
        return text;
    };


    const resetStates = () => {
        setErrors("")
        setData([]);
    };

    const callGPT = async (promptText: string): Promise<string> => {
        const openai = new OpenAIApi(configuration);
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-16k",
            messages: [{role: "user", content: promptText}],
            temperature: 1,
            max_tokens: 16000
        });
        const content: string = completion.data.choices[0].message?.content as string;
        return content
    }

    const divideNumber = () => {
        const resultArray: number[] = [];
        let remainingNumber: number = parseInt(posts.number);

        while (remainingNumber > 0) {
            if (remainingNumber >= max_value) {
                resultArray.push(max_value);
                remainingNumber -= max_value;
            } else {
                resultArray.push(remainingNumber);
                remainingNumber = 0;
            }
        }

        return resultArray;
    };


    const generatePosts = async () => {

        if (!posts) return;
        resetStates();

        try {
            const resultArray: number[] = divideNumber();
            setLoading(true);

            let _data: string[] = [];
            let content, finalText;
            await Promise.all(resultArray.map(async (number) => {
                    const promptText: string = Prompt({
                        postType: posts.postType,
                        topic: posts.topic,
                        number: number.toString()
                    });
                    content = await callGPT(promptText)
                    finalText = content.replace(/\d+\.\s*|\.|-|_/g, '').split('\n');
                    for (const post of finalText) {
                        if (post) {
                            _data.push(post.trim())
                        }
                    }
                })
            )
            setData(_data);
        } catch (error: any) {
            if (error.response) {
                setErrors(error.response.data.error.message);
            } else {
                setErrors(error.message);
            }
        } finally {
            setLoading(false);
            const resetErrors = setTimeout(function () {
                setErrors("");
            }, 5000);
            // Clear the timeout when done
            clearTimeout(resetErrors);
        }
    }


    const areAllKeysFilled = (state: any): boolean => {
        return Object.values(state).every((value) => Boolean(value));
    };


    return (
        <main className='min-h-screen bg-slate-900 p-4'>
            <h1 className='text-center p-8 text-4xl text-white'>Generate Posts Using OpenAi</h1>
            {errors &&
                <div className="bg-red-100 border-t border-b border-red-500 text-red-700 px-4 py-3 mb-3" role="alert">
                    <p className="font-bold">{errors}</p>
                </div>
            }
            <div
                className="flex space-y-12 flex-col items-center justify-center w-full md:flex-row md:space-x-48 md:space-y-0">
                {loading ? <div className='flex flex-col items-center gap-4 text-white'>
                        <span className='text-2xl'>Generating desired posts...</span>
                        <Loader/>
                    </div>
                    : <div className="w-full space-y-4 md:w-1/3">
                        <div className='w-full space-y-6 md:w-2/3'>

                            <label className='flex items-start flex-col gap-2 text-white' htmlFor="street-address">Number
                                <input name="number_of_posts" type={"number"} placeholder={"Number of posts"}
                                       className="inputs"
                                       value={posts.number}
                                       onChange={(e) => {
                                           setPosts((prev) => ({
                                               ...prev,
                                               number: parseInt(e.target.value) >= 1 ? e.target.value : ""
                                           }))


                                       }}/></label>

                            <label className='flex items-start flex-col gap-2 text-white' htmlFor="street-address">
                                Topic
                                <input
                                    className="inputs"
                                    name="topic" type={"text"} placeholder={"Topic category eg: fire, coffee"}
                                    value={posts.topic}
                                    onChange={(e) => {
                                        setPosts((prev) => ({
                                                ...prev,
                                                topic: e.target.value
                                            })
                                        );
                                    }
                                    }/></label>

                            <label
                                className='flex items-start flex-col gap-2 text-white mb-2 text-sm font-medium'
                                htmlFor="country">Post
                                Type
                                <select name="post_type"
                                        className=' border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500'
                                        onChange={(e) => {
                                            resetStates()
                                            setPosts((prev) => ({
                                                ...prev,
                                                postType: e.target.value
                                            }));
                                        }
                                        }
                                        value={posts.postType}
                                >
                                    <option value={""} disabled>Choose Type</option>
                                    <option value={"Social Media"}>Social Media</option>
                                    <option value={"Statistic"}>Statistic</option>
                                </select>
                            </label>
                        </div>


                        <div
                            className={`space-y-2 text-white bg-slate-800 rounded w-fit max-w-full shadow-white ${posts.postType ? "p-4" : "p-0"}`}>
                            {areAllKeysFilled(posts) &&
                                <p className='border border-gray-200 p-2 rounded w-full overflow-auto'>
                                    Your Prompt will generate
                                    <span className='underline mx-1 text-green-500 font-bold'>{posts.number}</span>
                                    posts for
                                    <span className='underline mx-1 text-green-500 font-bold'> {posts.postType}</span>
                                    about
                                    <span className='underline mx-1 text-green-500 font-bold'>{posts.topic}</span>
                                </p>

                            }
                            {posts.postType === "Social Media" &&
                                <>
                                    <p>
                                        Posts need to be:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 capitalize">
                                        <li>useful (worth to be shared)</li>
                                        <li>without numbering</li>
                                        <li>no extra new lines between posts</li>
                                        <li>no do at the end</li>
                                        <li>no quotations</li>
                                        <li>between 10 and 50 words each</li>
                                        <li>No duplicates</li>
                                    </ol>
                                </>
                            }
                            {
                                posts.postType === "Statistic" &&

                                <>
                                    <p>
                                        Statistic need to be:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 capitalize">
                                        <li>Useful (worth to be shared)</li>
                                        <li>Without numbering</li>
                                        <li>No extra new lines between posts</li>
                                        <li>No dot at the end</li>
                                        <li>No quotations</li>
                                        <li>Under 20 words each (without counting reference link)</li>
                                        <li>No duplicates (don't repeat yourself)</li>
                                    </ol>
                                </>
                            }


                        </div>
                        <button type={"button"} name="generate"
                                className={"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"}
                                onClick={generatePosts}
                                style={{
                                    opacity: areAllKeysFilled(posts) ? 1 : 0.5
                                }}
                                disabled={!areAllKeysFilled(posts)}
                        >
                            {data.length > 0 ? "Regenerate" : "Generate"}
                        </button>
                    </div>}


                {data.length > 0 &&
                    <div className='w-full md:w-1/3'>
                        <div className="p-4  bg-slate-800 h-96 overflow-auto rounded">
                            <ol className={"list-disc list-inside space-y-4"}>
                                {data.map((post, index) => (
                                    <li key={index} className={"text-white"}>
                                        {posts.postType === "Statistic" ?
                                            <LinkifyString inputString={post}/>
                                            :
                                            post
                                        }
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className='relative w-full flex justify-end'>
                            <ExportData postsData={data} type={posts.postType}/>
                            <div className='absolute sm:right-0 md:left-0 bottom-0 lg:top-1/2 lg:-translate-y-1/2'>
                                <span className='text-white'>Counter: {data.length} item</span>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </main>
    )
        ;
}

export default App;
