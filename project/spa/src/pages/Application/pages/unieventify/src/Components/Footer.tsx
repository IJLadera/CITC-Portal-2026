import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Footer } from "flowbite-react";
import {
    BsDribbble,
    BsFacebook,
    BsGithub,
    BsInstagram,
    BsTwitter,
} from "react-icons/bs";
import EmailIcon from "@mui/icons-material/Email";
import PhoneEnabledIcon from "@mui/icons-material/PhoneEnabled";


export default function FooterComponent() {
    return (
        <Footer bgDark>
            <div className="w-full">
                <div className="flex justify-center mt-5 gap-x-8 sm:flex-row flex-col">
                    <div className="flex items-center bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="bg-gray-900 p-4 rounded-l-lg flex items-center">
                            <LocationOnIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-400">USTP</p>
                            <p className="text-lg text-yellow-400 font-semibold">
                                Lapasan, CDO.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="bg-gray-900 p-4 rounded-l-lg flex items-center">
                            <EmailIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-400">unieventifyustp@gmail.com</p>
                            <p className="text-lg text-yellow-400 font-semibold">
                                unieventifyustp@gmail.com
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
                        <div className="bg-gray-900 p-4 rounded-l-lg flex items-center">
                            <PhoneEnabledIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-400">09268889945</p>
                            <p className="text-lg text-yellow-400 font-semibold">
                                09268889945
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="grid w-full sm:grid-cols-3 mx-10 grid-cols-1 gap-8 lg:gap-x-32 py-8 lg:w-4/5 xl:w-3/5 sm:mx-5">
                        <div>
                            <Footer.Title
                                title="Unieventify"
                                className="font-bold text-white text-3xl"
                            />
                            <p className="text-gray-400 mb-5">
                                Your ultimate event management platform, making everything
                                simple and efficient.
                            </p>
                            <Footer.Title
                                title="network"
                                className="font-bold text-white"
                            />
                            <div className="mt-4 flex space-x-2 sm:mt-0 ">
                                <Footer.Icon href="#" icon={BsFacebook} />
                                <Footer.Icon href="#" icon={BsInstagram} />
                                <Footer.Icon href="#" icon={BsTwitter} />
                                <Footer.Icon href="#" icon={BsGithub} />
                                <Footer.Icon href="#" icon={BsDribbble} />
                            </div>
                        </div>
                        <div>
                            <Footer.Title
                                title="help center"
                                className="text-white text-lg"
                            />
                            <Footer.LinkGroup col>
                                <Footer.Link href="https://docs.google.com/forms/d/e/1FAIpQLScDgqtr8zcwz18KBYWky0L57KjEPlmCoDIbmTYFC3R4q8FOYg/viewform">Feedback form</Footer.Link>
                                <Footer.Link href="https://docs.google.com/forms/d/e/1FAIpQLSeov_4dwFHFvp8dg3CyHlrot0mjrxCdLoPwUNgu-TNxEmMEHg/viewform">SUS</Footer.Link>
                                <Footer.Link href="https://docs.google.com/forms/d/e/1FAIpQLScE7tGtJTIKvVptizmWTz15ErkfUsSD-tJR1Wf3TfHEdpLHWA/viewform">Bug Report</Footer.Link>
                            </Footer.LinkGroup>
                        </div>
                        <div>
                            <Footer.Title title="legal" className="text-white text-lg" />
                            <Footer.LinkGroup col>
                                <Footer.Link href="#">Privacy Policy</Footer.Link>
                                <Footer.Link href="#">Licensing</Footer.Link>
                                <Footer.Link href="#">Terms &amp; Conditions</Footer.Link>
                            </Footer.LinkGroup>
                        </div>
                    </div>
                    <div></div>
                </div>
                <div className="flex justify-center bg-gray-700">
                    <div className="w-full px-4 py-6 sm:flex sm:items-center sm:justify-between lg:w-4/5">
                        <Footer.Copyright
                            href="#"
                            by=". All Right Reserved UniEventify"
                            year={2024}
                        />
                        <Footer.LinkGroup>
                            <Footer.Link href="#">About</Footer.Link>
                            <Footer.Link href="#">Privacy Policy</Footer.Link>
                            <Footer.Link href="#">Contact</Footer.Link>
                        </Footer.LinkGroup>
                    </div>
                </div>
            </div>
        </Footer>
    )
}
