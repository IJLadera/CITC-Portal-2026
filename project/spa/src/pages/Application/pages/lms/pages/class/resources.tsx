import { ChangeEvent } from "react";

export const onFileInput = (event:ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
        const inputFile = event.target.files[0];

        const reader = new FileReader()

        reader.onload = async ({target}) => {
            // const csv = 
        }
    }
}