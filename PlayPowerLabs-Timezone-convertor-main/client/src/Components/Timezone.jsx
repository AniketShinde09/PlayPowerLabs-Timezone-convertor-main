import React, { useState, useEffect } from 'react'; // Import React and its hooks: useState and useEffect
import moment from 'moment-timezone'; // Import moment-timezone for handling date and time with timezones
import Slider from 'react-slider'; // Import Slider component for interactive time selection
import Select from 'react-select'; // Import Select component for dropdowns
import DatePicker from 'react-datepicker'; // Import DatePicker component for selecting dates
import { FaCalendarAlt, FaCalendarMinus, FaLink } from "react-icons/fa"; // Import calendar and link icons from react-icons
import { BiSortAlt2 } from "react-icons/bi"; // Import sorting icon from react-icons
import { MdDarkMode, MdLightMode } from "react-icons/md"; // Import dark and light mode icons from react-icons
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for the DatePicker component
import '../assets/css/timezone.css' // Import custom CSS for styling
import { DndContext, closestCorners } from '@dnd-kit/core'; // Import DnD context and collision detection utilities
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'; // Import sortable context and utilities for drag-and-drop sorting
import { CSS } from '@dnd-kit/utilities'; // Import CSS utilities for handling CSS transforms

// Function to generate initial times for selected timezones
const generateInitialTimes = () => ({
    'Asia/Kolkata': moment().tz('Asia/Kolkata').format('HH:mm'), // Get current time in Asia/Kolkata timezone and format it as HH:mm
    UTC: moment().tz('UTC').format('HH:mm'), // Get current time in UTC timezone and format it as HH:mm
});

// Function to generate initial timezone labels
const generateInitialTimezones = () => ({
    'Asia/Kolkata': 'Asia/Kolkata', // Set initial timezone label for Asia/Kolkata
    UTC: 'UTC', // Set initial timezone label for UTC
});

// Function to generate slider marks (currently returns an empty array)
function generateSliderMarks() {
    const marks = []; // Initialize an empty array for slider marks
    return marks; // Return the empty array
}

// Function to get the abbreviation for a given timezone
const getTimezoneAbbr = (zone) => {
    return moment.tz(zone).format('z'); // Format timezone abbreviation (e.g., IST, UTC) using moment-timezone
};

// Function to get the GMT offset for a given timezone
const getTimezoneOffset = (zone) => {
    const offset = moment.tz(zone).format('Z'); // Get timezone offset (e.g., +05:30) using moment-timezone
    return `GMT ${offset}`; // Format the offset as GMT +hh:mm
};

// Function to generate time options for the select dropdown (15-minute intervals in a day)
const generateTimeOptions = () => {
    const options = []; // Initialize an empty array for time options
    for (let i = 0; i < 96; i++) { // There are 96 intervals of 15 minutes in a 24-hour day
        const hour = Math.floor(i / 4); // Calculate the hour based on the index
        const minute = (i % 4) * 15; // Calculate the minute based on the index
        const time = moment().startOf('day').add(hour, 'hours').add(minute, 'minutes').format('h:mm A'); // Create a time string
        options.push({ value: `${hour}:${minute < 10 ? '0' : ''}${minute}`, label: time }); // Add the option to the array
    }
    return options; // Return the array of time options
};

// Main Timezone component
const Timezone = () => {
    // State hooks to manage the component's state
    const [selectedTimes, setSelectedTimes] = useState(generateInitialTimes()); // Store selected times for each timezone
    const [selectedDate, setSelectedDate] = useState(new Date()); // Store the selected date
    const [reverseOrder, setReverseOrder] = useState(false); // State to toggle the order of timezones
    const [timezones, setTimezones] = useState(generateInitialTimezones()); // Store the list of timezones
    const [isDark, setIsDark] = useState(() => JSON.parse(localStorage.getItem('isDark')) || false); // Load and store dark mode preference from local storage
    const [isSharing, setIsSharing] = useState(false); // State to manage sharing functionality (not used in the code)

    // Effect to update local storage whenever dark mode preference changes
    useEffect(() => {
        localStorage.setItem('isDark', JSON.stringify(isDark)); // Save dark mode preference to local storage
    }, [isDark]);

    // Handler for changing the selected date
    const handleDateChange = (date) => {
        setSelectedDate(date); // Update the selected date state
    };

    // Handler for changing the time of a specific timezone
    const handleTimeChange = (zone, value) => {
        const updatedDateTime = moment(selectedDate).startOf('day').add(value, 'minutes').format('YYYY-MM-DD HH:mm'); // Create a datetime string based on minutes
        const updatedTimes = { ...selectedTimes, [zone]: moment(updatedDateTime).format('HH:mm') }; // Update time for the selected timezone

        // Update times for all other timezones based on the new selected time
        Object.keys(timezones).forEach(tz => {
            if (tz !== zone) {
                updatedTimes[tz] = moment.tz(updatedDateTime, timezones[zone]).tz(timezones[tz]).format('HH:mm');
            }
        });

        setSelectedTimes(updatedTimes); // Update state with new times
    };

    // Handler for adding a new timezone
    const addNewTimezone = (option) => {
        const label = option.value; // Get the selected timezone label
        const zone = label.replace(/\//g, '-'); // Replace slashes in the timezone label
        setTimezones({ ...timezones, [zone]: label }); // Add the new timezone to the state
        setSelectedTimes({ ...selectedTimes, [zone]: moment().tz(label).format('HH:mm') }); // Set initial time for the new timezone
    };

    // Handler for removing a timezone
    const removeTimezone = (zone) => {
        const newTimezones = { ...timezones };
        delete newTimezones[zone]; // Remove the timezone from the state
        const newSelectedTimes = { ...selectedTimes };
        delete newSelectedTimes[zone]; // Remove the corresponding time
        setSelectedTimes(newSelectedTimes); // Update state with remaining timezones
        setTimezones(newTimezones); // Update state with remaining timezones
    };

    // Generate a list of all available timezones
    const allTimezones = moment.tz.names().map(tz => ({ value: tz, label: tz }));

    // Generate time options for the select dropdown
    const timeOptions = generateTimeOptions();

    // Toggle the order of timezones between normal and reverse
    const reverseTimezones = () => {
        setReverseOrder(!reverseOrder); // Toggle the reverseOrder state
    };

    // Handler for drag-and-drop sorting of timezones
    const onDragEnd = ({ active, over }) => {
        if (active.id !== over.id) { // Check if the dragged item has moved
            const oldIndex = timezoneEntries.findIndex(([zone]) => zone === active.id); // Find the old index of the dragged item
            const newIndex = timezoneEntries.findIndex(([zone]) => zone === over.id); // Find the new index of the item it is dropped over

            const reorderedEntries = arrayMove(timezoneEntries, oldIndex, newIndex); // Reorder timezones
            setSelectedTimes(Object.fromEntries(reorderedEntries)); // Update state with the reordered timezones
        }
    };

    // Convert selected times object to an array of entries (for sorting)
    let timezoneEntries = Object.entries(selectedTimes);

    // Reverse the order if reverseOrder is true
    if (reverseOrder) {
        timezoneEntries = timezoneEntries.reverse();
    }

    // Container component for displaying and interacting with each timezone
    const Container = ({ zone, time }) => {
        const [localTime, setLocalTime] = useState(moment.duration(time, 'HH:mm').asMinutes()); // State for local time in minutes

        // Use the sortable hook to make the container draggable
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: zone });
        const style = { transform: CSS.Transform.toString(transform), transition }; // Apply drag-and-drop styles

        // Handler for slider changes
        const handleSliderChange = (value) => {
            setLocalTime(value); // Update local time based on slider value
        };

        // Handler for completing slider changes
        const handleSliderChangeComplete = (value) => {
            handleTimeChange(zone, value); // Update time for the timezone when slider change is completed
        };

        // Handler for changing the selected time from the dropdown
        const handleTimeSelectChange = (selectedOption) => {
            setLocalTime(moment.duration(selectedOption.value).asMinutes()); // Update local time based on selected option
            handleTimeChange(zone, moment.duration(selectedOption.value).asMinutes()); // Update time for the timezone
        };

        // Effect to update local time when time changes
        useEffect(() => {
            setLocalTime(moment.duration(time, 'HH:mm').asMinutes()); // Set local time based on updated time
        }, [time]);

        // Function to format and display time for the timezone
        const formatDisplayTime = (zone, minutes) => {
            const updatedDateTime = moment(selectedDate).startOf('day').add(minutes, 'minutes').format('YYYY-MM-DD HH:mm'); // Create datetime string
            return moment.tz(updatedDateTime, timezones[zone]).format('h:mm A'); // Format time based on timezone
        };

        // Function to format and display date for the timezone
        const formatDisplayDate = (zone, minutes) => {
            const updatedDateTime = moment(selectedDate).startOf('day').add(minutes, 'minutes').format('YYYY-MM-DD HH:mm'); // Create datetime string
            return moment.tz(updatedDateTime, timezones[zone]).format('ddd D, MMMM'); // Format date based on timezone
        };

        // Labels for slider marks (every 3 hours)
        const labels = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];

        return (
            <div className={'zone-container'} id={isDark && 'dark-zone-container'} ref={setNodeRef} style={style} >
                <div className='zone-upper-row'>
                    <div className='drag-button' {...listeners} {...attributes}></div> {/* Draggable handle for sorting */}
                    <div className='zone-left-box'>
                        <h1 style={isDark ? { color: 'white' } : {}}>{getTimezoneAbbr(timezones[zone])}</h1> {/* Display timezone abbreviation */}
                        <p>{zone.replace(/-/g, '/')}</p> {/* Display timezone label */}
                    </div>
                    <div className='zone-right-box'>
                        <Select
                            className={"time-picker"}
                            classNamePrefix="select"
                            placeholder={formatDisplayTime(zone, localTime)} // Display current time
                            value={timeOptions.find(option => moment.duration(option.value).asMinutes() === localTime)} // Set selected value
                            options={timeOptions}
                            onChange={handleTimeSelectChange} // Handle time selection change
                            styles={{
                                indicatorsContainer: () => ({ display: 'none' }), // Hide select dropdown indicators
                                container: (prev) => ({ ...prev, width: '15vw', height: '8vh' }), // Style select container
                                placeholder: (prev) => ({ ...prev, fontSize: '1.5rem', fontWeight: 'bold', color: isDark ? 'white' : 'black', }), // Style placeholder text
                                valueContainer: (prev) => ({
                                    ...prev,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    borderRadius: '0.5vh',
                                    color: isDark ? 'white' : 'black',
                                    backgroundColor: isDark ? '#2c2f34ef' : 'white',
                                }) // Style selected value container
                            }}
                        />
                        <span>
                            <span>{getTimezoneOffset(zone)}</span> {/* Display GMT offset */}
                            <span>{formatDisplayDate(zone, localTime)}</span> {/* Display date */}
                        </span>
                    </div>
                    <button className='remove' onClick={() => removeTimezone(zone)}>x</button> {/* Button to remove timezone */}
                </div>
                <Slider
                    className="time-slider"
                    thumbClassName="time-thumb"
                    trackClassName={isDark ? 'time-track dark-time-track' : 'time-track'} // Style slider track based on dark mode
                    markClassName="time-mark"
                    marks={generateSliderMarks()} // Set slider marks (currently empty)
                    min={0}
                    max={1440} // Maximum value for 24 hours in minutes
                    step={15} // Step size for slider (15 minutes)
                    value={localTime}
                    onChange={handleSliderChange} // Handle slider value change
                    onAfterChange={handleSliderChangeComplete} // Handle slider change completion
                    renderThumb={(props, state) => <div {...props}>||</div>} // Custom thumb rendering
                    renderMark={(props) => <span {...props} />} // Custom mark rendering
                />
                {labels && (
                    <div className="labels">
                        {generateSliderMarks()
                            .filter((mark, index) => mark % 180 === 0) // Show labels at every 3 hours
                            .map((mark, index) => (
                                <div key={mark}>{labels[index]}</div>
                            ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="main-container" id={isDark && 'dark-main-container'}>
            <h1 style={{ margin: '20px', color: 'black', fontSize: '58px' }}>🕒 Timezone Converter 🕒</h1> {/* Title of the component */}
            <div className='upper-row' id={isDark && 'dark-upper-row'}>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    placeholder={"Select Timezone"}
                    isSearchable={true} // Allow searching in the timezone dropdown
                    name="timezone"
                    options={allTimezones} // Set timezone options
                    onChange={addNewTimezone} // Handle adding a new timezone
                    styles={{
                        container: (prev) => ({
                            ...prev,
                            width: "400px",
                            height: '30px',
                        }),
                        valueContainer: (prev) => ({
                            ...prev,
                            width: "400px",
                            height: '30px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? '#2c2f34ef' : 'white',
                        }),
                        indicatorsContainer: (prev) => ({
                            ...prev,
                            borderRadius: '0 0.5vh 0.5vh 0',
                            backgroundColor: isDark ? '#2c2f34ef' : 'white',
                        })
                    }}
                />
                <div className='date-container'>
                    <DatePicker
                        className={isDark ? 'date-picker dark-date-picker' : 'date-picker'}
                        id='date-picker'
                        selected={selectedDate} // Set selected date
                        onChange={handleDateChange} // Handle date change
                        dateFormat="MMMM d, yyyy" // Set date format
                    />
                    <label className='calendar-box' htmlFor="date-picker"
                        style={isDark ? { backgroundColor: '#2c2f34ef', borderRadius: '0 1vh 1vh 0' } : {}}>
                        <FaCalendarAlt /> {/* Calendar icon */}
                    </label>
                </div>

                <div className='filter-container'>
                    <div><FaCalendarMinus /></div> {/* Calendar minus icon */}
                    <div onClick={reverseTimezones}><BiSortAlt2 /></div> {/* Sort icon for reversing order */}
                    <div><FaLink /></div> {/* Link icon (functionality not implemented) */}
                    <div onClick={() => setIsDark(prev => !prev)}>{isDark ? <MdLightMode /> : <MdDarkMode />}</div> {/* Toggle dark mode */}
                </div>
            </div>

            {/* Drag-and-drop context and sortable list */}
            <DndContext collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                <div className='time-converter'>
                    <SortableContext items={timezoneEntries.map(([zone]) => zone)} strategy={verticalListSortingStrategy}>
                        {timezoneEntries.map(([zone, time]) => (
                            <Container key={zone} zone={zone} time={time} /> // Render each timezone container
                        ))}
                    </SortableContext>
                </div>
            </DndContext>
        </div>
    );
};

export default Timezone; // Export the Timezone component
