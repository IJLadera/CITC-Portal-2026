import { useState, type ChangeEvent } from "react";
import { Button, TextInput } from "flowbite-react";

interface User {
  firstname: string;
  lastname: string;
  prefix: string;
  suffix: string;
  phone: string;
  email: string;
  profileImage?: string;
  signature?: string;
}

export default function ProfilePage() {
  // Mock user data (replace with Django API later)
  const [user, setUser] = useState<User>({
    firstname: "Juan",
    lastname: "Dela Cruz",
    prefix: "Mr.",
    suffix: "",
    phone: "09123456789",
    email: "juan.delacruz@example.com",
    profileImage: "", // put URL if exists
    signature: "",
  });

  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    user.signature || null
  );
  const [profilePreview, setProfilePreview] = useState<string | null>(
    user.profileImage || null
  );

  // Handle profile image upload
  const handleProfileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Handle signature upload
  const handleSignatureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSignaturePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div
        className="min-h-screen bg-cover bg-no-repeat bg-top"
        style={{
            backgroundImage: "url(/assets/Wave.png)",
        }}
        >
      <section className="w-full lg:w-[1500px] px-4 mx-auto pt-[20px]">
        <div className="relative flex flex-col min-w-0 break-words bg-gradient-to-r from-white to-blue-100 w-full mb-6 shadow-xl rounded-lg mt-16">
          <div className="px-6">
            <div className="flex justify-between items-start">
              {/* Left: Profile image */}
              <div className="mt-6 ml-[100px]">
                <div className="relative w-[200px] h-[200px]">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full border-4 border-blue-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-yellow-500 text-white text-[90px] rounded-full border-4 border-blue-500">
                      {user.firstname[0].toUpperCase()}
                      {user.lastname[0].toUpperCase()}
                    </div>
                  )}

                  <input
                    type="file"
                    id="profile_image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileUpload}
                  />
                  <label
                    htmlFor="profile_image"
                    className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2 shadow cursor-pointer hover:bg-blue-700 transition-all duration-200"
                  >
                    ✏️
                  </label>
                </div>
              </div>

              {/* Center: Profile form */}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col mt-6"
              >
                {/* Name */}
                <div className="flex justify-between gap-6 mb-4">
                  <div>
                    <label className="flex font-semibold" htmlFor="firstname">
                      First Name
                    </label>
                    <TextInput
                      id="firstname"
                      value={user.firstname}
                      onChange={(e) =>
                        setUser({ ...user, firstname: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                  <div>
                    <label className="flex font-semibold" htmlFor="lastname">
                      Last Name
                    </label>
                    <TextInput
                      id="lastname"
                      value={user.lastname}
                      onChange={(e) =>
                        setUser({ ...user, lastname: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                </div>

                {/* Prefix / Suffix */}
                <div className="flex justify-between gap-6 mb-4">
                  <div>
                    <label className="flex font-semibold" htmlFor="prefix">
                      Prefix
                    </label>
                    <TextInput
                      id="prefix"
                      value={user.prefix}
                      onChange={(e) =>
                        setUser({ ...user, prefix: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                  <div>
                    <label className="flex font-semibold" htmlFor="suffix">
                      Suffix
                    </label>
                    <TextInput
                      id="suffix"
                      value={user.suffix}
                      onChange={(e) =>
                        setUser({ ...user, suffix: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="flex justify-between gap-6 mb-6">
                  <div>
                    <label className="flex font-semibold" htmlFor="phone">
                      Phone Number
                    </label>
                    <TextInput
                      id="phone"
                      value={user.phone}
                      onChange={(e) =>
                        setUser({ ...user, phone: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                  <div>
                    <label className="flex font-semibold" htmlFor="email">
                      Email Address
                    </label>
                    <TextInput
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      className="w-[250px]"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4 mt-4">
                  <Button color="blue">Update Profile</Button>

                  <label
                    htmlFor="signature_image"
                    className="text-white font-semibold px-12 py-2 rounded-lg bg-blue-600 cursor-pointer hover:bg-blue-700 transition-all duration-200"
                  >
                    Upload Signature
                  </label>
                  <input
                    type="file"
                    id="signature_image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                  />
                </div>
              </form>

              {/* Right: Signature preview */}
              <div className="mt-6 mr-[100px]">
                <h3 className="font-semibold text-center mb-2">
                  Signature Preview
                </h3>
                <div className="border border-gray-400 rounded w-[300px] h-[125px] flex items-center justify-center bg-white">
                  {signaturePreview ? (
                    <img
                      src={signaturePreview}
                      className="max-w-full max-h-full object-contain"
                      alt="Signature"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">
                      No signature uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit password link */}
            <div className="text-center content-center mt-10 mb-8 hover:text-black font-semibold text-gray-500 shadow-lg w-[197px] py-2 rounded-lg mx-auto">
              <a href="/password/edit">Edit password</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
