import AddClass from "./components/AddClass";

export default function Class () {

    const onClickAdd = () => {
        console.log('click!')
    }

    return (
        <div className="max-h-screen">
            <div className="grid grid-cols-4 gap-4">
                <AddClass />
            </div>
        </div>
    )
}