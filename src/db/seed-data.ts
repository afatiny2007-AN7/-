import type { DifficultyLevel } from './queries.ts';

export interface SeedQuestionItem {
  externalId: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false';
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: number;
  imageUrl?: string | null;
}

export interface SeedQuizCatalogItem {
  title: string;
  description: string | null;
  isActive: boolean;
  questions: SeedQuestionItem[];
}

export interface SeedFolderCatalogItem {
  name: string;
  description: string | null;
  quizzes: SeedQuizCatalogItem[];
}

export const INITIAL_FOLDER_CATALOG: SeedFolderCatalogItem[] = [
  {
    name: 'CHAPTER 7',
    description: 'تنظيم وبنيان الحاسب',
    quizzes: [
      {
        title: 'CECS217 - Chapter 7: Input/Output - Easy Quiz',
        description: null,
        isActive: true,
        questions: [
          {
            externalId: 1,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What is the primary function of an I/O module?',
            options: [
              'To provide an interface between the computer and peripheral devices',
              'To perform arithmetic operations',
              'To replace main memory',
              'To execute application programs',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 2,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'Which devices are classified as human-readable peripherals?',
            options: [
              'Disks and sensors',
              'Displays and printers',
              'Routers and network links',
              'DMA controllers and channels',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 3,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What is the purpose of a buffer in an external device?',
            options: [
              'To select a device address',
              'To store the next instruction address',
              'To hold transferred data temporarily',
              'To determine interrupt priority',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 4,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: "Which signal reports a device's state or readiness?",
            options: ['Data', 'Control', 'Address', 'Status'],
            correctAnswer: 3,
          },
          {
            externalId: 5,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'Which I/O command checks whether a device is ready, busy, completed, or in error?',
            options: ['Test', 'Write', 'Read', 'Control'],
            correctAnswer: 0,
          },
          {
            externalId: 6,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'In programmed I/O, what does the processor do while waiting for a device?',
            options: [
              "It repeatedly checks the device's status",
              'It transfers data directly through DMA',
              'It executes an I/O program independently',
              'It stops checking and resumes after an interrupt',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 7,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'In interrupt-driven I/O, what does the processor do while a device is busy?',
            options: [
              'It continuously polls the device',
              'It continues executing other instructions',
              'It transfers the entire block through DMA',
              'It disables the I/O module',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 8,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What does DMA transfer directly?',
            options: [
              'Interrupt vectors between devices',
              'Processor registers to the stack',
              'A block of data between an I/O module and main memory',
              'Instructions between the cache and processor',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 9,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'When does a DMA controller typically interrupt the processor?',
            options: [
              'Before the device is selected',
              'After every bit is transferred',
              'Whenever the processor issues a Test command',
              'When the block transfer is complete',
            ],
            correctAnswer: 3,
          },
          {
            externalId: 10,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What does the Data Count register track in a DMA module?',
            options: [
              'The number of words remaining',
              'The address of the I/O device',
              'The processor status word',
              'The interrupt service routine',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 11,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'Which channel serves several high-speed devices but transfers data for one device at a time?',
            options: [
              'Selector channel',
              'Multiplexor channel',
              'I/O bus',
              'Interrupt channel',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 12,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'Which standard is identified for internal hard drives?',
            options: ['USB', 'SATA', 'FireWire', 'Thunderbolt'],
            correctAnswer: 1,
          },
          {
            externalId: 13,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              "Which command obtains data from a device and places it in the I/O module's buffer?",
            options: ['Write', 'Control', 'Read', 'Test'],
            correctAnswer: 2,
          },
          {
            externalId: 14,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              "Which component converts electrical signals to and from a device's data forms?",
            options: ['Buffer', 'Control logic', 'Data register', 'Transducer'],
            correctAnswer: 3,
          },
          {
            externalId: 15,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'Which device category includes disks and sensors?',
            options: [
              'Machine-readable devices',
              'Human-readable devices',
              'Communication devices',
              'Selector channels',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 16,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'Which is an example of a communication device listed in the material?',
            options: ['Display', 'Network link', 'Printer', 'Disk'],
            correctAnswer: 1,
          },
          {
            externalId: 17,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'Which register temporarily holds data during transfer inside an I/O module?',
            options: [
              'Status/Control register',
              'Address register',
              'Data register',
              'Program Counter',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 18,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What does a Control command do in I/O operations?',
            options: [
              'Reports whether a device is ready',
              'Transfers data from a device to the processor',
              'Checks whether an operation is complete',
              'Activates a peripheral and specifies what it should do',
            ],
            correctAnswer: 3,
          },
          {
            externalId: 19,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question: 'What is the main function of an I/O channel?',
            options: [
              'To execute an I/O program and control devices and data transfers',
              'To store the processor status word',
              'To convert electrical signals into images',
              'To determine memory addresses',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 20,
            difficulty: 'easy',
            questionType: 'multiple_choice',
            question:
              'Which standard is identified for internal expansion cards such as graphics cards?',
            options: ['USB', 'PCI Express', 'SCSI', 'InfiniBand'],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'CECS217 - Chapter 7: Input/Output - Medium Quiz',
        description: null,
        isActive: true,
        questions: [
          {
            externalId: 1,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'Which statement correctly describes the system and peripheral interfaces of an I/O module?',
            options: [
              'Both interfaces connect only to peripheral devices',
              'The system interface communicates with the processor and memory; the peripheral interface communicates with devices',
              'The system interface stores data; the peripheral interface executes programs',
              'The system interface is used only for interrupts',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 2,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'Which sequence correctly represents keyboard input as described in the I/O example?',
            options: [
              'I/O module → keyboard transducer → character',
              'Keyboard character → keyboard transducer → coded bits → I/O module',
              'Coded bits → monitor transducer → keyboard',
              'Processor → monitor → keyboard transducer',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 3,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'Which statement distinguishes memory-mapped I/O from isolated I/O?',
            options: [
              'Memory-mapped I/O uses a shared address space; isolated I/O uses separate address spaces',
              'Memory-mapped I/O requires special I/O instructions; isolated I/O uses memory instructions',
              'Both methods use separate address spaces',
              'Isolated I/O uses no device addresses',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 4,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What is a stated benefit of memory-mapped I/O?',
            options: [
              'It reserves no memory addresses for I/O',
              'It uses a separate address space',
              'Memory-access instructions can access I/O registers, providing more flexible programming',
              'It eliminates device registers',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 5,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What is the main limitation of programmed I/O?',
            options: [
              'The device cannot report its status',
              'The processor remains occupied checking status and transferring each word',
              'It requires a separate I/O address space',
              'It cannot issue control commands',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 6,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'What is the main benefit of interrupt-driven I/O over programmed I/O?',
            options: [
              'The processor does not need to transfer data',
              'The device transfers every word without processor involvement',
              'The processor avoids repeated status checking while the device becomes ready',
              'It eliminates the need for an I/O module',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 7,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'During interrupt processing, what does the processor save before entering the interrupt handler?',
            options: [
              'The device data and count registers',
              'The next instruction address (PC) and processor status (PSW)',
              'The I/O address space and system bus',
              'The interrupt vector and device buffer',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 8,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'How does software polling identify the module requesting an interrupt?',
            options: [
              'It checks module status sequentially after an interrupt',
              'It assigns a dedicated line to every device',
              'It forwards an acknowledgement through a hardware chain',
              "It reads each device's data register",
            ],
            correctAnswer: 0,
          },
          {
            externalId: 9,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What occurs in a daisy-chain interrupt arrangement?',
            options: [
              'Each module transfers data directly to memory',
              'The acknowledgement passes through modules until the requesting module captures it and supplies its vector',
              'The processor polls every device before accepting an interrupt',
              'Each module receives a separate interrupt line',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 10,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'Which information is required to set up a DMA transfer?',
            options: [
              'Processor instruction, interrupt priority, and cache level',
              'Read or write operation, I/O device address, starting memory address, and word count',
              'Device category, buffer size, and status code only',
              'Interrupt vector, stack pointer, and program counter',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 11,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What is cycle stealing in DMA?',
            options: [
              'The DMA controller temporarily takes the system bus for a transfer, after which the processor continues',
              'The processor transfers every word through its registers',
              'The DMA controller stops the processor for the entire block transfer',
              'The I/O device takes over the address space',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 12,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'How does a multiplexor channel differ from a selector channel?',
            options: [
              'A multiplexor channel interleaves transfers from multiple devices; a selector channel serves one device at a time',
              'A selector channel interleaves transfers; a multiplexor channel serves one device at a time',
              'Both channels serve only one device at a time',
              'Neither channel controls data transfers',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 13,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What is the benefit of using isolated I/O addressing?',
            options: [
              'Memory-access instructions can access I/O registers',
              'I/O has its own address space and does not use memory addresses',
              'It eliminates the need for device registers',
              'It removes the need for special I/O instructions',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 14,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'In the interrupt-driven I/O process, what does the I/O module do when the device becomes ready?',
            options: [
              'It transfers the entire block directly to memory',
              'It places data in its data register and signals an interrupt to the processor',
              'It repeatedly polls the processor',
              "It saves the processor's PC and PSW",
            ],
            correctAnswer: 1,
          },
          {
            externalId: 15,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'What does the processor do after an interrupt handler services the device?',
            options: [
              'It restores the saved registers, PC, and PSW, then resumes the interrupted program',
              'It restarts the program from its first instruction',
              'It disables the system bus',
              'It transfers the remaining data through a selector channel',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 16,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'Which limitation applies to interrupt-driven I/O even though it reduces processor waiting?',
            options: [
              'The processor still performs the data transfer',
              'The device cannot send an interrupt',
              'The method requires a separate address space',
              'The I/O module cannot buffer data',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 17,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'What is the role of the address register in a DMA module?',
            options: [
              'It stores the number of words remaining',
              'It holds the memory address for the transfer',
              "It reports the device's readiness",
              'It saves the interrupt service routine address',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 18,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'What is the primary advantage of integrating DMA and I/O in a single-bus configuration?',
            options: [
              'It removes all system-bus use',
              'DMA and I/O exchange data without using the system bus, reducing system-bus cycles',
              'It eliminates the need for main memory',
              'It enables the processor to transfer data without DMA',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 19,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question:
              'Which connection standard is listed for keyboards, printers, and external storage?',
            options: ['SATA', 'PCI Express', 'USB', 'InfiniBand'],
            correctAnswer: 2,
          },
          {
            externalId: 20,
            difficulty: 'medium',
            questionType: 'multiple_choice',
            question: 'Which standard is listed for audio and video equipment?',
            options: ['FireWire', 'SCSI', 'Thunderbolt', 'SATA'],
            correctAnswer: 0,
          },
        ],
      },
      {
        title: 'CECS217 - Chapter 7: Input/Output - Hard Quiz',
        description: null,
        isActive: true,
        questions: [
          {
            externalId: 1,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              "A processor repeatedly reads a device's status until it becomes ready, then transfers each word itself. Which method is being used, and what is its principal cost?",
            options: [
              'Interrupt-driven I/O; every word must pass through a DMA controller',
              'Programmed I/O; the processor remains occupied polling and transferring data',
              'DMA; the processor must poll before each word',
              'Multiplexor channel; the processor cannot access memory',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 2,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A device signals readiness while the processor is executing other instructions. The processor later services the request and transfers the data. Which statement best characterizes this method?',
            options: [
              'Programmed I/O avoids polling by transferring data directly to memory',
              'Interrupt-driven I/O reduces repeated waiting, but the processor still transfers the data',
              'DMA transfers the data without processor setup',
              'A selector channel transfers data without a processor',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 3,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'An interrupt arrives while an instruction is in progress. Which sequence is consistent with the described hardware steps?',
            options: [
              'Enter the handler, save the PC, complete the instruction, acknowledge the request',
              'Complete the current instruction, acknowledge the request, save the PC and PSW, then enter the handler',
              'Acknowledge the request, transfer all data, then save the PC',
              'Save the device buffer, restart the current instruction, then enter the handler',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 4,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Why must an interrupt handler save processor state before servicing a device?',
            options: [
              'An interrupt can occur at any program point, and the interrupted program needs its state preserved to continue correctly',
              "The device requires the processor's cache to be emptied",
              'The handler must convert the interrupt vector into data',
              'The system bus cannot carry status signals',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 5,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A system uses software polling to identify the source of an interrupt. What is the principal limitation of this approach?',
            options: [
              'It requires an interrupt line for every module',
              'Modules are checked one by one, which takes time',
              'It cannot identify any requesting module',
              'It transfers each data word through the DMA controller',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 6,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Several modules share an interrupt request line, and the acknowledgement passes through them in sequence. Which mechanism is described, and what constraint does it have?',
            options: [
              'Daisy chaining; acknowledgement travels through the chain',
              'Multiple interrupt lines; only a few lines are available',
              'Software polling; the vector must be placed on the data lines',
              'Bus arbitration; the processor cannot acknowledge requests',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 7,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A DMA transfer is configured with an operation, device address, starting memory address, and word count. Which register stores the starting memory address?',
            options: [
              'Data Count register',
              'Data Register',
              'Address Register',
              'Status/Control register',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 8,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A processor briefly waits when DMA transfers a word over a bus shared by both. Which explanation is correct?',
            options: [
              "DMA removes the processor's per-word transfer work, but cycle stealing causes brief bus waits",
              'DMA eliminates all bus contention and all processor waits',
              'The processor must move the word before DMA can proceed',
              "The I/O module takes over the processor's instruction cycle",
            ],
            correctAnswer: 0,
          },
          {
            externalId: 9,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Which DMA configuration allows I/O modules to communicate with DMA over a separate I/O bus, keeping DMA-I/O traffic off the system bus?',
            options: [
              'Single bus, detached DMA',
              'Single bus, integrated DMA-I/O',
              'I/O bus configuration',
              'Selector channel configuration',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 10,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Why can DMA use designated breakpoints within an instruction cycle?',
            options: [
              'To identify which device requested an interrupt',
              'To obtain the bus at selected points while temporarily pausing the processor',
              'To avoid setting a word count',
              'To let the processor transfer data without a DMA module',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 11,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A design needs incoming network data to reach the processor sooner by reducing memory-access delays. Which technique and destination are described?',
            options: [
              'Direct Cache Access; the last-level cache',
              'Cycle stealing; the data register',
              'Interrupt-driven I/O; the status register',
              'Programmed I/O; the system bus',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 12,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Which statement accurately compares programmed I/O, interrupt-driven I/O, and DMA by identifying who moves the data?',
            options: [
              'Programmed I/O: CPU; interrupt-driven I/O: CPU; DMA: DMA module',
              'Programmed I/O: I/O module; interrupt-driven I/O: DMA; DMA: CPU',
              'Programmed I/O: CPU; interrupt-driven I/O: I/O module; DMA: CPU',
              'All three methods use the processor to move every word',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 13,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A processor uses memory-access instructions to read and write device registers in a shared address space. Which addressing method is in use, and what trade-off is associated with it?',
            options: [
              'Isolated I/O; it reserves addresses for memory',
              'Memory-mapped I/O; I/O registers use part of the memory address space',
              'Isolated I/O; it requires no special instructions',
              'DMA addressing; it removes memory addresses from devices',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 14,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              "During an interrupt, a processor saves the address of the next instruction and its status, then loads the handler's starting address. What is the purpose of this sequence?",
            options: [
              'To allow the handler to replace the interrupted program',
              'To preserve the return point and transfer control to the interrupt handler',
              'To transfer the device data directly to the cache',
              'To identify which device uses a selector channel',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 15,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A design uses multiple interrupt lines. What advantage and limitation are associated with this approach?',
            options: [
              'It helps identify the source, but only a limited number of lines are available',
              'It avoids separate lines, but modules must be polled in sequence',
              'It removes the need for acknowledgements, but requires a DMA controller',
              'It transfers data directly, but uses more system-bus cycles',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 16,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A DMA module and several I/O modules share one system bus. The DMA module requires two system-bus cycles for a word to pass through it. Which configuration is described?',
            options: [
              'Single bus, detached DMA',
              'Single bus, integrated DMA-I/O',
              'Separate I/O bus',
              'Multiplexor channel',
            ],
            correctAnswer: 0,
          },
          {
            externalId: 17,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Which statement accurately describes the role of the control logic inside a DMA module?',
            options: [
              'It tracks the number of words remaining',
              'It temporarily holds transferred data',
              'It coordinates requests, read/write operations, and completion interrupts',
              'It identifies the peripheral category',
            ],
            correctAnswer: 2,
          },
          {
            externalId: 18,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A system interleaves transfers from multiple low-speed devices through one channel. Which channel type is most appropriate?',
            options: [
              'Selector channel',
              'Multiplexor channel',
              'DMA breakpoint',
              'Daisy-chain channel',
            ],
            correctAnswer: 1,
          },
          {
            externalId: 19,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'A computer requires a standard for connecting storage devices, especially in servers. Which standard is identified for this use?',
            options: ['SCSI', 'USB', 'FireWire', 'Thunderbolt'],
            correctAnswer: 0,
          },
          {
            externalId: 20,
            difficulty: 'hard',
            questionType: 'multiple_choice',
            question:
              'Which statement distinguishes the purpose of interconnection standards from the physical connector shape?',
            options: [
              'The standard defines how devices connect and exchange data; the connector shape is a separate concept',
              'The connector shape defines all data-transfer rules',
              'Both terms refer only to internal connections',
              'Standards specify device categories but not communication',
            ],
            correctAnswer: 0,
          },
        ],
      },
    ],
  },
];
